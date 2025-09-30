import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CampaignsService, CreateCampaignDto, UpdateCampaignDto } from './campaigns.service';
import { CampaignAutomationService } from './campaign-automation.service';
import { Campaign, CampaignStatus, CampaignType, TriggerType } from './entities/campaign.entity';
import { Customer } from '../customers/entities/customer.entity';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let campaignRepository: Repository<Campaign>;
  let customerRepository: Repository<Customer>;
  let campaignAutomationService: CampaignAutomationService;
  let eventEmitter: EventEmitter2;

  const mockCampaignRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCustomerRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockCampaignAutomationService = {
    pauseCampaign: jest.fn(),
    resumeCampaign: jest.fn(),
    getCampaignAnalytics: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: CampaignAutomationService,
          useValue: mockCampaignAutomationService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    campaignRepository = module.get<Repository<Campaign>>(getRepositoryToken(Campaign));
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    campaignAutomationService = module.get<CampaignAutomationService>(CampaignAutomationService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForTenant', () => {
    it('should return campaigns for a tenant', async () => {
      const mockCampaigns = [
        { id: '1', tenantId: 'tenant1', name: 'Campaign 1' },
        { id: '2', tenantId: 'tenant1', name: 'Campaign 2' },
      ];

      mockCampaignRepository.find.mockResolvedValue(mockCampaigns);

      const result = await service.findAllForTenant('tenant1');

      expect(result).toEqual(mockCampaigns);
      expect(mockCampaignRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1' },
        order: { createdAt: 'DESC' },
      });
    });

    it('should apply filters when provided', async () => {
      const filters = {
        status: CampaignStatus.ACTIVE,
        type: CampaignType.EMAIL,
        limit: 10,
        offset: 0,
      };

      mockCampaignRepository.find.mockResolvedValue([]);

      await service.findAllForTenant('tenant1', filters);

      expect(mockCampaignRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant1',
          status: CampaignStatus.ACTIVE,
          type: CampaignType.EMAIL,
        },
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('createForTenant', () => {
    const createDto: CreateCampaignDto = {
      name: 'Test Campaign',
      description: 'Test description',
      type: CampaignType.EMAIL,
      triggerType: TriggerType.MANUAL,
      subject: 'Test Subject',
      content: 'Test content',
      targetAudience: { customerIds: ['customer1'] },
    };

    it('should create a campaign successfully', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        ...createDto,
        status: CampaignStatus.DRAFT,
        estimatedRecipients: 1,
      };

      mockCustomerRepository.count.mockResolvedValue(1);
      mockCampaignRepository.save.mockResolvedValue(mockCampaign);

      const result = await service.createForTenant('tenant1', createDto, 'user1');

      expect(result).toEqual(mockCampaign);
      expect(mockCampaignRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant1',
          status: CampaignStatus.DRAFT,
          estimatedRecipients: 1,
          createdBy: 'user1',
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('campaign.created', mockCampaign);
    });

    it('should validate campaign data', async () => {
      const invalidDto = {
        ...createDto,
        type: CampaignType.EMAIL,
        subject: '', // Empty subject for email campaign
      };

      await expect(service.createForTenant('tenant1', invalidDto, 'user1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should validate scheduled campaigns have scheduledAt', async () => {
      const scheduledDto = {
        ...createDto,
        triggerType: TriggerType.SCHEDULED,
        // Missing scheduledAt
      };

      await expect(service.createForTenant('tenant1', scheduledDto, 'user1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('findOneForTenant', () => {
    it('should return a campaign by ID and tenant', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        name: 'Test Campaign',
      };

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);

      const result = await service.findOneForTenant('tenant1', '1');

      expect(result).toEqual(mockCampaign);
      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', tenantId: 'tenant1' },
        relations: ['tenant'],
      });
    });

    it('should throw NotFoundException when campaign not found', async () => {
      mockCampaignRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneForTenant('tenant1', '1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('updateForTenant', () => {
    const updateDto: UpdateCampaignDto = {
      name: 'Updated Campaign',
      description: 'Updated description',
    };

    it('should update a campaign successfully', async () => {
      const existingCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.DRAFT,
        targetAudience: { customerIds: ['customer1'] },
      };

      const updatedCampaign = {
        ...existingCampaign,
        ...updateDto,
      };

      mockCampaignRepository.findOne.mockResolvedValue(existingCampaign);
      mockCustomerRepository.count.mockResolvedValue(1);
      mockCampaignRepository.save.mockResolvedValue(updatedCampaign);

      const result = await service.updateForTenant('tenant1', '1', updateDto, 'user1');

      expect(result).toEqual(updatedCampaign);
      expect(mockCampaignRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateDto,
          updatedBy: 'user1',
        })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('campaign.updated', updatedCampaign);
    });

    it('should throw NotFoundException when campaign not found', async () => {
      mockCampaignRepository.findOne.mockResolvedValue(null);

      await expect(service.updateForTenant('tenant1', '1', updateDto, 'user1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should validate status transitions', async () => {
      const existingCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.COMPLETED,
      };

      const invalidUpdateDto = {
        status: CampaignStatus.ACTIVE,
      };

      mockCampaignRepository.findOne.mockResolvedValue(existingCampaign);

      await expect(service.updateForTenant('tenant1', '1', invalidUpdateDto, 'user1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('removeForTenant', () => {
    it('should soft delete a campaign', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.DRAFT,
      };

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      mockCampaignRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.removeForTenant('tenant1', '1');

      expect(mockCampaignRepository.softDelete).toHaveBeenCalledWith('1');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('campaign.deleted', mockCampaign);
    });

    it('should pause active campaign before deletion', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.ACTIVE,
      };

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      mockCampaignRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.removeForTenant('tenant1', '1');

      expect(mockCampaignAutomationService.pauseCampaign).toHaveBeenCalledWith('1');
      expect(mockCampaignRepository.softDelete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when campaign not found', async () => {
      mockCampaignRepository.findOne.mockResolvedValue(null);

      await expect(service.removeForTenant('tenant1', '1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('launchCampaign', () => {
    it('should launch a draft campaign as immediate', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.DRAFT,
        triggerType: TriggerType.MANUAL,
      };

      const updatedCampaign = {
        ...mockCampaign,
        status: CampaignStatus.ACTIVE,
        startedAt: expect.any(Date),
      };

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      mockCampaignRepository.save.mockResolvedValue(updatedCampaign);

      const result = await service.launchCampaign('tenant1', '1');

      expect(result.status).toBe(CampaignStatus.ACTIVE);
      expect(mockCampaignRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CampaignStatus.ACTIVE,
          startedAt: expect.any(Date),
        })
      );
    });

    it('should launch a scheduled campaign', async () => {
      const futureDate = new Date(Date.now() + 60000);
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.DRAFT,
        triggerType: TriggerType.SCHEDULED,
        scheduledAt: futureDate,
      };

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      mockCampaignRepository.save.mockResolvedValue({
        ...mockCampaign,
        status: CampaignStatus.SCHEDULED,
      });

      const result = await service.launchCampaign('tenant1', '1');

      expect(result.status).toBe(CampaignStatus.SCHEDULED);
    });

    it('should throw BadRequestException for non-draft campaigns', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.ACTIVE,
      };

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);

      await expect(service.launchCampaign('tenant1', '1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('pauseCampaign', () => {
    it('should pause an active campaign', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.ACTIVE,
      };

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      mockCampaignRepository.save.mockResolvedValue({
        ...mockCampaign,
        status: CampaignStatus.PAUSED,
      });

      const result = await service.pauseCampaign('tenant1', '1');

      expect(result.status).toBe(CampaignStatus.PAUSED);
      expect(mockCampaignAutomationService.pauseCampaign).toHaveBeenCalledWith('1');
    });
  });

  describe('resumeCampaign', () => {
    it('should resume a paused campaign', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.PAUSED,
      };

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      mockCampaignRepository.save.mockResolvedValue({
        ...mockCampaign,
        status: CampaignStatus.ACTIVE,
      });

      const result = await service.resumeCampaign('tenant1', '1');

      expect(result.status).toBe(CampaignStatus.ACTIVE);
      expect(mockCampaignAutomationService.resumeCampaign).toHaveBeenCalledWith('1');
    });
  });

  describe('getCampaignSummary', () => {
    it('should return campaign summary for tenant', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          total: '10',
          active: '3',
          sent: '100',
          totalOpened: '50',
          totalClicked: '25',
        }),
      };

      mockCampaignRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getCampaignSummary('tenant1');

      expect(result).toEqual({
        totalCampaigns: 10,
        activeCampaigns: 3,
        totalSent: 100,
        averageOpenRate: 50,
        averageClickRate: 50,
      });
    });
  });

  describe('estimateRecipients', () => {
    it('should estimate recipients by customer IDs', async () => {
      const targetAudience = { customerIds: ['customer1', 'customer2'] };
      mockCustomerRepository.count.mockResolvedValue(2);

      const result = await service['estimateRecipients'](targetAudience);

      expect(result).toBe(2);
      expect(mockCustomerRepository.count).toHaveBeenCalledWith({
        where: { id: expect.any(Object) },
      });
    });

    it('should estimate recipients by segment', async () => {
      const targetAudience = { segment: 'premium' };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };

      mockCustomerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service['estimateRecipients'](targetAudience);

      expect(result).toBe(5);
    });
  });
});