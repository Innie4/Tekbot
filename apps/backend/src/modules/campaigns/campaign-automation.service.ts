import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, MoreThan } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigType } from '@nestjs/config';
import { Campaign, CampaignStatus, CampaignType, TriggerType } from './entities/campaign.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { NotificationService } from '../notifications/notification.service';
import { reminderConfig } from '../appointments/config/reminder.config';

export interface CampaignJobData {
  campaignId: string;
  tenantId: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  templateData?: Record<string, any>;
  variantId?: string;
}

export interface CampaignExecutionResult {
  campaignId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  errors: string[];
}

@Injectable()
export class CampaignAutomationService {
  private readonly logger = new Logger(CampaignAutomationService.name);

  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepository: Repository<Campaign>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectQueue('campaign-execution')
    private readonly campaignQueue: Queue<CampaignJobData>,
    private readonly notificationService: NotificationService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(reminderConfig.KEY)
    private readonly config: ConfigType<typeof reminderConfig>,
  ) {}

  /**
   * Cron job to process scheduled campaigns
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledCampaigns(): Promise<void> {
    try {
      const now = new Date();
      const scheduledCampaigns = await this.campaignRepository.find({
        where: {
          status: CampaignStatus.SCHEDULED,
          scheduledAt: LessThan(now),
        },
        relations: ['tenant'],
      });

      for (const campaign of scheduledCampaigns) {
        await this.executeCampaign(campaign.id);
      }
    } catch (error) {
      this.logger.error('Error processing scheduled campaigns:', error);
    }
  }

  /**
   * Cron job to process recurring campaigns
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processRecurringCampaigns(): Promise<void> {
    try {
      const activeCampaigns = await this.campaignRepository.find({
        where: {
          status: CampaignStatus.ACTIVE,
          triggerType: 'recurring',
        },
      });

      for (const campaign of activeCampaigns) {
        if (this.shouldExecuteRecurringCampaign(campaign)) {
          await this.executeCampaign(campaign.id);
        }
      }
    } catch (error) {
      this.logger.error('Error processing recurring campaigns:', error);
    }
  }

  /**
   * Execute a campaign
   */
  async executeCampaign(campaignId: string): Promise<CampaignExecutionResult> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
      relations: ['tenant'],
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    this.logger.log(`Executing campaign: ${campaign.name} (${campaign.id})`);

    // Update campaign status
    await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.ACTIVE,
      startedAt: new Date(),
    });

    try {
      // Get target recipients
      const recipients = await this.getTargetRecipients(campaign);
      
      // Handle A/B testing
      const variants = this.prepareVariants(campaign, recipients);
      
      let totalSent = 0;
      let totalFailed = 0;
      const errors: string[] = [];

      // Execute campaign for each variant
      for (const variant of variants) {
        const result = await this.executeVariant(campaign, variant);
        totalSent += result.sentCount;
        totalFailed += result.failedCount;
        errors.push(...result.errors);
      }

      // Update campaign metrics
      await this.updateCampaignMetrics(campaignId, {
        sentCount: totalSent,
        failedCount: totalFailed,
        estimatedRecipients: recipients.length,
      });

      // Mark as completed if not recurring
      if (campaign.triggerType !== TriggerType.RECURRING) {
        await this.campaignRepository.update(campaignId, {
          status: CampaignStatus.COMPLETED,
          completedAt: new Date(),
        });
      }

      const result: CampaignExecutionResult = {
        campaignId,
        totalRecipients: recipients.length,
        sentCount: totalSent,
        failedCount: totalFailed,
        errors,
      };

      this.eventEmitter.emit('campaign.executed', result);
      return result;

    } catch (error) {
      this.logger.error(`Campaign execution failed: ${error.message}`, error);
      
      await this.campaignRepository.update(campaignId, {
        status: CampaignStatus.CANCELLED,
        executionLog: [
          {
            timestamp: new Date(),
            action: 'execution_failed',
            error: error.message,
          },
        ],
      });

      throw error;
    }
  }

  /**
   * Get target recipients for a campaign
   */
  private async getTargetRecipients(campaign: Campaign): Promise<Customer[]> {
    const { targetAudience } = campaign;
    
    if (!targetAudience) {
      // Default to all customers for the tenant
      return this.customerRepository.find({
        where: { tenantId: campaign.tenantId },
      });
    }

    let query = this.customerRepository.createQueryBuilder('customer')
      .where('customer.tenantId = :tenantId', { tenantId: campaign.tenantId });

    // Apply customer ID filters
    if (targetAudience.customerIds?.length) {
      query = query.andWhere('customer.id IN (:...customerIds)', {
        customerIds: targetAudience.customerIds,
      });
    }

    // Apply segment filters (placeholder for future segmentation logic)
    if (targetAudience.segments?.length) {
      // TODO: Implement segment-based filtering
      this.logger.warn('Segment-based filtering not yet implemented');
    }

    // Apply custom filters
    if (targetAudience.filters) {
      for (const [field, value] of Object.entries(targetAudience.filters)) {
        if (value !== undefined && value !== null) {
          query = query.andWhere(`customer.${field} = :${field}`, { [field]: value });
        }
      }
    }

    // Exclude segments
    if (targetAudience.excludeSegments?.length) {
      // TODO: Implement exclude segment logic
      this.logger.warn('Exclude segment filtering not yet implemented');
    }

    return query.getMany();
  }

  /**
   * Prepare A/B test variants
   */
  private prepareVariants(campaign: Campaign, recipients: Customer[]): Array<{
    id: string;
    name: string;
    recipients: Customer[];
    content: any;
  }> {
    if (!campaign.abTestConfig?.enabled || !campaign.abTestConfig.variants?.length) {
      return [{
        id: 'default',
        name: 'Default',
        recipients,
        content: {
          subject: campaign.subject,
          content: campaign.content,
          htmlContent: campaign.htmlContent,
        },
      }];
    }

    const variants = [];
    let recipientIndex = 0;

    for (const variant of campaign.abTestConfig.variants) {
      const variantRecipientCount = Math.floor(recipients.length * (variant.percentage / 100));
      const variantRecipients = recipients.slice(recipientIndex, recipientIndex + variantRecipientCount);
      
      variants.push({
        id: variant.id,
        name: variant.name,
        recipients: variantRecipients,
        content: {
          subject: variant.subject || campaign.subject,
          content: variant.content || campaign.content,
          htmlContent: variant.htmlContent || campaign.htmlContent,
        },
      });

      recipientIndex += variantRecipientCount;
    }

    return variants;
  }

  /**
   * Execute a campaign variant
   */
  private async executeVariant(
    campaign: Campaign,
    variant: { id: string; name: string; recipients: Customer[]; content: any }
  ): Promise<{ sentCount: number; failedCount: number; errors: string[] }> {
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const recipient of variant.recipients) {
      try {
        const jobData: CampaignJobData = {
          campaignId: campaign.id,
          tenantId: campaign.tenantId,
          recipientId: recipient.id,
          recipientEmail: recipient.email,
          recipientPhone: recipient.phone,
          recipientName: recipient.name,
          templateData: {
            ...campaign.templateData,
            customerName: recipient.name,
            customerEmail: recipient.email,
          },
          variantId: variant.id,
        };

        // Apply throttling if configured
        const delay = this.calculateThrottlingDelay(campaign);
        
        await this.campaignQueue.add('send-campaign-message', jobData, {
          delay,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        });

        sentCount++;
      } catch (error) {
        failedCount++;
        errors.push(`Failed to queue message for ${recipient.email}: ${error.message}`);
        this.logger.error(`Failed to queue campaign message for recipient ${recipient.id}:`, error);
      }
    }

    return { sentCount, failedCount, errors };
  }

  /**
   * Calculate throttling delay
   */
  private calculateThrottlingDelay(campaign: Campaign): number {
    const throttling = campaign.settings?.throttling;
    
    if (!throttling?.enabled) {
      return 0;
    }

    // Simple throttling: delay based on max per hour
    if (throttling.maxPerHour) {
      return Math.floor(3600000 / throttling.maxPerHour); // milliseconds
    }

    return 0;
  }

  /**
   * Update campaign metrics
   */
  private async updateCampaignMetrics(
    campaignId: string,
    metrics: Partial<{
      sentCount: number;
      deliveredCount: number;
      openedCount: number;
      clickedCount: number;
      failedCount: number;
      estimatedRecipients: number;
    }>
  ): Promise<void> {
    await this.campaignRepository.update(campaignId, metrics);
  }

  /**
   * Check if recurring campaign should execute
   */
  private shouldExecuteRecurringCampaign(campaign: Campaign): boolean {
    if (!campaign.recurringConfig) {
      return false;
    }

    const { frequency, interval, endDate, maxOccurrences } = campaign.recurringConfig;
    const now = new Date();
    const lastExecution = campaign.completedAt || campaign.created_at;

    // Check end date
    if (endDate && now > endDate) {
      return false;
    }

    // Check max occurrences (would need execution count tracking)
    if (maxOccurrences && campaign.sentCount >= maxOccurrences) {
      return false;
    }

    // Calculate next execution time based on frequency
    const nextExecution = new Date(lastExecution);
    
    switch (frequency) {
      case 'daily':
        nextExecution.setDate(nextExecution.getDate() + interval);
        break;
      case 'weekly':
        nextExecution.setDate(nextExecution.getDate() + (interval * 7));
        break;
      case 'monthly':
        nextExecution.setMonth(nextExecution.getMonth() + interval);
        break;
      case 'yearly':
        nextExecution.setFullYear(nextExecution.getFullYear() + interval);
        break;
    }

    return now >= nextExecution;
  }

  /**
   * Event handler for appointment events
   */
  @OnEvent('appointment.created')
  async handleAppointmentCreated(appointment: Appointment): Promise<void> {
    await this.triggerEventBasedCampaigns('appointment_created', {
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      tenantId: appointment.tenantId,
    });
  }

  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(appointment: Appointment): Promise<void> {
    await this.triggerEventBasedCampaigns('appointment_cancelled', {
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      tenantId: appointment.tenantId,
    });
  }

  @OnEvent('appointment.completed')
  async handleAppointmentCompleted(appointment: Appointment): Promise<void> {
    await this.triggerEventBasedCampaigns('appointment_completed', {
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      tenantId: appointment.tenantId,
    });
  }

  /**
   * Trigger event-based campaigns
   */
  private async triggerEventBasedCampaigns(
    eventType: string,
    eventData: Record<string, any>
  ): Promise<void> {
    try {
      const campaigns = await this.campaignRepository.find({
        where: {
          status: CampaignStatus.ACTIVE,
          triggerType: 'event_based',
          tenantId: eventData.tenantId,
        },
      });

      for (const campaign of campaigns) {
        if (this.matchesEventTrigger(campaign, eventType, eventData)) {
          // Apply delay if configured
          const delay = campaign.eventTriggers?.delay || 0;
          
          if (delay > 0) {
            setTimeout(() => {
              this.executeCampaign(campaign.id);
            }, delay * 60 * 1000); // delay is in minutes
          } else {
            await this.executeCampaign(campaign.id);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error triggering event-based campaigns for ${eventType}:`, error);
    }
  }

  /**
   * Check if campaign matches event trigger
   */
  private matchesEventTrigger(
    campaign: Campaign,
    eventType: string,
    eventData: Record<string, any>
  ): boolean {
    const { eventTriggers } = campaign;
    
    if (!eventTriggers?.events?.includes(eventType)) {
      return false;
    }

    // Check additional conditions
    if (eventTriggers.conditions) {
      for (const [key, value] of Object.entries(eventTriggers.conditions)) {
        if (eventData[key] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.PAUSED,
      updatedBy: 'system',
    });

    // Cancel pending jobs
    const jobs = await this.campaignQueue.getJobs(['delayed', 'waiting']);
    const campaignJobs = jobs.filter(job => job.data.campaignId === campaignId);
    
    for (const job of campaignJobs) {
      await job.remove();
    }

    this.logger.log(`Campaign ${campaignId} paused and pending jobs cancelled`);
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    await this.campaignRepository.update(campaignId, {
      status: CampaignStatus.ACTIVE,
      updatedBy: 'system',
    });

    this.logger.log(`Campaign ${campaignId} resumed`);
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<{
    metrics: any;
    performance: any;
    timeline: any[];
  }> {
    const campaign = await this.campaignRepository.findOne({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const metrics = {
      sent: campaign.sentCount,
      delivered: campaign.deliveredCount,
      opened: campaign.openedCount,
      clicked: campaign.clickedCount,
      unsubscribed: campaign.unsubscribedCount,
      bounced: campaign.bouncedCount,
      failed: campaign.failedCount,
    };

    const performance = {
      deliveryRate: campaign.sentCount > 0 ? (campaign.deliveredCount / campaign.sentCount) * 100 : 0,
      openRate: campaign.deliveredCount > 0 ? (campaign.openedCount / campaign.deliveredCount) * 100 : 0,
      clickRate: campaign.openedCount > 0 ? (campaign.clickedCount / campaign.openedCount) * 100 : 0,
      unsubscribeRate: campaign.deliveredCount > 0 ? (campaign.unsubscribedCount / campaign.deliveredCount) * 100 : 0,
    };

    const timeline = campaign.executionLog || [];

    return { metrics, performance, timeline };
  }
}