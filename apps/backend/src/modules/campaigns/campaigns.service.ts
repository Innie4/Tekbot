import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Campaign, CampaignStatus, CampaignType, TriggerType } from './entities/campaign.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CampaignAutomationService } from './campaign-automation.service';

export interface CreateCampaignDto {
  name: string;
  description?: string;
  type: CampaignType;
  triggerType: TriggerType;
  subject?: string;
  content?: string;
  htmlContent?: string;
  templateData?: Record<string, any>;
  targetAudience?: {
    segments?: string[];
    customerIds?: string[];
    filters?: Record<string, any>;
    excludeSegments?: string[];
  };
  scheduledAt?: Date;
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    maxOccurrences?: number;
  };
  eventTriggers?: {
    events: string[];
    conditions?: Record<string, any>;
    delay?: number;
  };
  settings?: {
    sendTime?: string;
    timezone?: string;
    throttling?: {
      enabled: boolean;
      maxPerHour?: number;
      maxPerDay?: number;
    };
    tracking?: {
      openTracking: boolean;
      clickTracking: boolean;
      unsubscribeTracking: boolean;
    };
  };
  abTestConfig?: {
    enabled: boolean;
    variants: Array<{
      id: string;
      name: string;
      percentage: number;
      subject?: string;
      content?: string;
      htmlContent?: string;
    }>;
    winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate';
    testDuration: number;
  };
}

export interface UpdateCampaignDto extends Partial<CreateCampaignDto> {
  status?: CampaignStatus;
}

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly campaignAutomationService: CampaignAutomationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAllForTenant(
    tenantId: string,
    options?: {
      status?: CampaignStatus;
      type?: CampaignType;
      limit?: number;
      offset?: number;
    }
  ): Promise<Campaign[]> {
    const queryOptions: FindManyOptions<Campaign> = {
      where: { tenantId },
      order: { created_at: 'DESC' },
    };

    if (options?.status) {
      queryOptions.where = { ...queryOptions.where, status: options.status };
    }

    if (options?.type) {
      queryOptions.where = { ...queryOptions.where, type: options.type };
    }

    if (options?.limit) {
      queryOptions.take = options.limit;
    }

    if (options?.offset) {
      queryOptions.skip = options.offset;
    }

    return this.campaignRepository.find(queryOptions);
  }

  async createForTenant(tenantId: string, dto: CreateCampaignDto, createdBy?: string): Promise<Campaign> {
    // Validate campaign data
    this.validateCampaignData(dto);

    // Estimate recipients if target audience is specified
    let estimatedRecipients = 0;
    if (dto.targetAudience) {
      estimatedRecipients = await this.estimateRecipients(tenantId, dto.targetAudience);
    }

    const campaign = this.campaignRepository.create({
      ...dto,
      tenantId,
      status: CampaignStatus.DRAFT,
      estimatedRecipients,
      createdBy,
    });

    const savedCampaign = await this.campaignRepository.save(campaign);

    // Emit event for campaign creation
    this.eventEmitter.emit('campaign.created', savedCampaign);

    this.logger.log(`Campaign created: ${savedCampaign.name} (${savedCampaign.id})`);
    return savedCampaign;
  }

  async findOneForTenant(tenantId: string, id: string): Promise<Campaign | null> {
    return this.campaignRepository.findOne({ 
      where: { tenantId, id },
      relations: ['tenant'],
    });
  }

  async updateForTenant(
    tenantId: string, 
    id: string, 
    dto: UpdateCampaignDto,
    updatedBy?: string
  ): Promise<Campaign> {
    const campaign = await this.findOneForTenant(tenantId, id);
    
    if (!campaign) {
      throw new BadRequestException(`Campaign ${id} not found`);
    }

    // Validate status transitions
    if (dto.status && !this.isValidStatusTransition(campaign.status, dto.status)) {
      throw new BadRequestException(`Invalid status transition from ${campaign.status} to ${dto.status}`);
    }

    // Update estimated recipients if target audience changed
    let estimatedRecipients: number | undefined;
    if (dto.targetAudience) {
      estimatedRecipients = await this.estimateRecipients(tenantId, dto.targetAudience);
    }

    await this.campaignRepository.update(
      { tenantId, id }, 
      { ...dto, estimatedRecipients, updatedBy, updated_at: new Date() }
    );

    const updatedCampaign = await this.findOneForTenant(tenantId, id);

    // Handle status changes
    if (dto.status && dto.status !== campaign.status) {
      await this.handleStatusChange(updatedCampaign!, campaign.status, dto.status);
    }

    this.eventEmitter.emit('campaign.updated', updatedCampaign);
    return updatedCampaign!;
  }

  async removeForTenant(tenantId: string, id: string): Promise<void> {
    const campaign = await this.findOneForTenant(tenantId, id);
    
    if (!campaign) {
      throw new BadRequestException(`Campaign ${id} not found`);
    }

    // Cancel campaign if it's active
    if (campaign.status === CampaignStatus.ACTIVE || campaign.status === CampaignStatus.SCHEDULED) {
      await this.campaignAutomationService.pauseCampaign(id);
    }

    await this.campaignRepository.softDelete({ tenantId, id });
    
    this.eventEmitter.emit('campaign.deleted', campaign);
    this.logger.log(`Campaign deleted: ${campaign.name} (${id})`);
  }

  /**
   * Launch a campaign
   */
  async launchCampaign(tenantId: string, id: string): Promise<Campaign> {
    const campaign = await this.findOneForTenant(tenantId, id);
    
    if (!campaign) {
      throw new BadRequestException(`Campaign ${id} not found`);
    }

    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException(`Campaign must be in draft status to launch`);
    }

    // Determine target status based on trigger type
    let targetStatus: CampaignStatus = CampaignStatus.ACTIVE;
    
    if (campaign.triggerType === 'scheduled' && campaign.scheduledAt) {
      targetStatus = campaign.scheduledAt > new Date() ? CampaignStatus.SCHEDULED : CampaignStatus.ACTIVE;
    }

    return this.updateForTenant(tenantId, id, { status: targetStatus });
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(tenantId: string, id: string): Promise<Campaign> {
    await this.campaignAutomationService.pauseCampaign(id);
    return this.updateForTenant(tenantId, id, { status: CampaignStatus.PAUSED });
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(tenantId: string, id: string): Promise<Campaign> {
    await this.campaignAutomationService.resumeCampaign(id);
    return this.updateForTenant(tenantId, id, { status: CampaignStatus.ACTIVE });
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(tenantId: string, id: string): Promise<any> {
    const campaign = await this.findOneForTenant(tenantId, id);
    
    if (!campaign) {
      throw new BadRequestException(`Campaign ${id} not found`);
    }

    return this.campaignAutomationService.getCampaignAnalytics(id);
  }

  /**
   * Get campaign performance summary for tenant
   */
  async getCampaignSummary(tenantId: string): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalSent: number;
    averageOpenRate: number;
    averageClickRate: number;
  }> {
    const campaigns = await this.campaignRepository.find({ where: { tenantId } });
    
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === CampaignStatus.ACTIVE).length;
    const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
    
    const campaignsWithDeliveries = campaigns.filter(c => c.deliveredCount > 0);
    const averageOpenRate = campaignsWithDeliveries.length > 0
      ? campaignsWithDeliveries.reduce((sum, c) => sum + (c.openedCount / c.deliveredCount), 0) / campaignsWithDeliveries.length * 100
      : 0;
    
    const campaignsWithOpens = campaigns.filter(c => c.openedCount > 0);
    const averageClickRate = campaignsWithOpens.length > 0
      ? campaignsWithOpens.reduce((sum, c) => sum + (c.clickedCount / c.openedCount), 0) / campaignsWithOpens.length * 100
      : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalSent,
      averageOpenRate,
      averageClickRate,
    };
  }

  /**
   * Validate campaign data
   */
  private validateCampaignData(dto: CreateCampaignDto): void {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Campaign name is required');
    }

    if (dto.type === 'email' && !dto.subject?.trim()) {
      throw new BadRequestException('Email campaigns require a subject');
    }

    if (!dto.content?.trim() && !dto.htmlContent?.trim()) {
      throw new BadRequestException('Campaign content is required');
    }

    if (dto.triggerType === TriggerType.SCHEDULED && !dto.scheduledAt) {
      throw new BadRequestException('Scheduled campaigns require a scheduled date');
    }

    if (dto.triggerType === TriggerType.RECURRING && !dto.recurringConfig) {
      throw new BadRequestException('Recurring campaigns require recurring configuration');
    }

    if (dto.triggerType === TriggerType.EVENT_BASED && !dto.eventTriggers?.events?.length) {
      throw new BadRequestException('Event-based campaigns require event triggers');
    }

    // Validate A/B test configuration
    if (dto.abTestConfig?.enabled) {
      const totalPercentage = dto.abTestConfig.variants.reduce((sum, v) => sum + v.percentage, 0);
      if (totalPercentage !== 100) {
        throw new BadRequestException('A/B test variant percentages must sum to 100');
      }
    }
  }

  /**
   * Estimate number of recipients
   */
  private async estimateRecipients(
    tenantId: string,
    targetAudience: CreateCampaignDto['targetAudience']
  ): Promise<number> {
    if (!targetAudience) {
      return this.customerRepository.count({ where: { tenantId } });
    }

    let query = this.customerRepository.createQueryBuilder('customer')
      .where('customer.tenantId = :tenantId', { tenantId });

    if (targetAudience.customerIds?.length) {
      query = query.andWhere('customer.id IN (:...customerIds)', {
        customerIds: targetAudience.customerIds,
      });
    }

    if (targetAudience.filters) {
      for (const [field, value] of Object.entries(targetAudience.filters)) {
        if (value !== undefined && value !== null) {
          query = query.andWhere(`customer.${field} = :${field}`, { [field]: value });
        }
      }
    }

    return query.getCount();
  }

  /**
   * Validate status transitions
   */
  private isValidStatusTransition(currentStatus: CampaignStatus, newStatus: CampaignStatus): boolean {
    const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      [CampaignStatus.DRAFT]: [CampaignStatus.SCHEDULED, CampaignStatus.ACTIVE],
      [CampaignStatus.SCHEDULED]: [CampaignStatus.ACTIVE, CampaignStatus.CANCELLED],
      [CampaignStatus.ACTIVE]: [CampaignStatus.PAUSED, CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
      [CampaignStatus.PAUSED]: [CampaignStatus.ACTIVE, CampaignStatus.CANCELLED],
      [CampaignStatus.COMPLETED]: [],
      [CampaignStatus.CANCELLED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Handle status changes
   */
  private async handleStatusChange(
    campaign: Campaign,
    oldStatus: CampaignStatus,
    newStatus: CampaignStatus
  ): Promise<void> {
    switch (newStatus) {
      case 'active':
        if (campaign.triggerType === TriggerType.MANUAL) {
          // Execute immediately for manual campaigns
          await this.campaignAutomationService.executeCampaign(campaign.id);
        }
        break;
      case 'paused':
        await this.campaignAutomationService.pauseCampaign(campaign.id);
        break;
      case 'cancelled':
        await this.campaignAutomationService.pauseCampaign(campaign.id);
        break;
    }

    this.logger.log(`Campaign ${campaign.id} status changed from ${oldStatus} to ${newStatus}`);
  }
}
