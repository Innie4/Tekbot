import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigType } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { CampaignAutomationService } from './campaign-automation.service';
import { Campaign, CampaignStatus, CampaignType, TriggerType } from './entities/campaign.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { NotificationService } from '../notification/notification.service';
import { reminderConfig } from '../appointments/config/reminder.config';

describe('CampaignAutomationService', () => {
  let service: CampaignAutomationService;
  let campaignRepository: Repository<Campaign>;
  let appointmentRepository: Repository<Appointment>;
  let customerRepository: Repository<Customer>;
  let campaignQueue: Queue;
  let notificationService: NotificationService;
  let eventEmitter: EventEmitter2;

  const mockCampaignRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAppointmentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockCustomerRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
    removeJobs: jest.fn(),
    getJobs: jest.fn(),
  };

  const mockNotificationService = {
    sendEmail: jest.fn(),
    sendSMS: jest.fn(),
    sendPushNotification: jest.fn(),
    sendInAppNotification: jest.fn(),
  };

  const mockEventEmitter = {
    on: jest.fn(),
    emit: jest.fn(),
  };

  const mockConfig = {
    enabled: true,
    defaultIntervals: [24, 2],
    email: { enabled: true },
    sms: { enabled: true },
    queue: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 10,
      removeOnFail: 5,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignAutomationService,
        {
          provide: getRepositoryToken(Campaign),
          useValue: mockCampaignRepository,
        },
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getQueueToken('campaign-execution'),
          useValue: mockQueue,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: reminderConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<CampaignAutomationService>(CampaignAutomationService);
    campaignRepository = module.get<Repository<Campaign>>(getRepositoryToken(Campaign));
    appointmentRepository = module.get<Repository<Appointment>>(getRepositoryToken(Appointment));
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    campaignQueue = module.get<Queue>(getQueueToken('campaign-execution'));
    notificationService = module.get<NotificationService>(NotificationService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processScheduledCampaigns', () => {
    it('should process scheduled campaigns that are due', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.SCHEDULED,
        triggerType: TriggerType.SCHEDULED,
        scheduledAt: new Date(Date.now() - 1000),
        type: CampaignType.EMAIL,
        targetAudience: { customerIds: ['customer1'] },
        subject: 'Test Campaign',
        content: 'Test content',
      } as Campaign;

      mockCampaignRepository.find.mockResolvedValue([mockCampaign]);
      jest.spyOn(service, 'executeCampaign').mockResolvedValue({
        campaignId: '1',
        success: true,
        recipientCount: 1,
        deliveredCount: 1,
        failedCount: 0,
      });

      await service.processScheduledCampaigns();

      expect(mockCampaignRepository.find).toHaveBeenCalledWith({
        where: {
          status: CampaignStatus.SCHEDULED,
          triggerType: TriggerType.SCHEDULED,
          scheduledAt: expect.any(Object),
        },
      });
      expect(service.executeCampaign).toHaveBeenCalledWith(mockCampaign);
    });
  });

  describe('executeCampaign', () => {
    it('should execute a campaign successfully', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        type: CampaignType.EMAIL,
        targetAudience: { customerIds: ['customer1'] },
        subject: 'Test Campaign',
        content: 'Test content',
        abTestConfig: null,
      } as Campaign;

      const mockCustomers = [
        { id: 'customer1', email: 'test@example.com', firstName: 'John' },
      ];

      jest.spyOn(service, 'getTargetRecipients').mockResolvedValue(mockCustomers);
      jest.spyOn(service, 'executeCampaignVariant').mockResolvedValue({
        delivered: 1,
        failed: 0,
      });
      jest.spyOn(service, 'updateCampaignMetrics').mockResolvedValue(undefined);

      const result = await service.executeCampaign(mockCampaign);

      expect(result).toEqual({
        campaignId: '1',
        success: true,
        recipientCount: 1,
        deliveredCount: 1,
        failedCount: 0,
      });
      expect(service.getTargetRecipients).toHaveBeenCalledWith(mockCampaign.targetAudience);
      expect(service.executeCampaignVariant).toHaveBeenCalled();
      expect(service.updateCampaignMetrics).toHaveBeenCalled();
    });

    it('should handle A/B testing campaigns', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        type: CampaignType.EMAIL,
        targetAudience: { customerIds: ['customer1', 'customer2'] },
        subject: 'Test Campaign',
        content: 'Test content',
        abTestConfig: {
          enabled: true,
          splitPercentage: 50,
          variantSubject: 'Variant Subject',
          variantContent: 'Variant content',
        },
      } as Campaign;

      const mockCustomers = [
        { id: 'customer1', email: 'test1@example.com', firstName: 'John' },
        { id: 'customer2', email: 'test2@example.com', firstName: 'Jane' },
      ];

      jest.spyOn(service, 'getTargetRecipients').mockResolvedValue(mockCustomers);
      jest.spyOn(service, 'executeCampaignVariant').mockResolvedValue({
        delivered: 1,
        failed: 0,
      });
      jest.spyOn(service, 'updateCampaignMetrics').mockResolvedValue(undefined);

      const result = await service.executeCampaign(mockCampaign);

      expect(result.success).toBe(true);
      expect(service.executeCampaignVariant).toHaveBeenCalledTimes(2);
    });
  });

  describe('getTargetRecipients', () => {
    it('should get recipients by customer IDs', async () => {
      const targetAudience = { customerIds: ['customer1', 'customer2'] };
      const mockCustomers = [
        { id: 'customer1', email: 'test1@example.com' },
        { id: 'customer2', email: 'test2@example.com' },
      ];

      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.getTargetRecipients(targetAudience);

      expect(result).toEqual(mockCustomers);
      expect(mockCustomerRepository.find).toHaveBeenCalledWith({
        where: { id: expect.any(Object) },
      });
    });

    it('should get recipients by segment', async () => {
      const targetAudience = { segment: 'premium' };
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'customer1', email: 'test1@example.com', segment: 'premium' },
        ]),
      };

      mockCustomerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTargetRecipients(targetAudience);

      expect(result).toHaveLength(1);
      expect(mockCustomerRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('pauseCampaign', () => {
    it('should pause an active campaign', async () => {
      const campaignId = '1';
      mockQueue.getJobs.mockResolvedValue([
        { id: 'job1', data: { campaignId }, remove: jest.fn() },
      ]);

      await service.pauseCampaign(campaignId);

      expect(mockQueue.getJobs).toHaveBeenCalledWith(['waiting', 'delayed']);
      expect(mockQueue.removeJobs).toHaveBeenCalledWith('*');
    });
  });

  describe('resumeCampaign', () => {
    it('should resume a paused campaign', async () => {
      const mockCampaign = {
        id: '1',
        status: CampaignStatus.PAUSED,
        triggerType: TriggerType.SCHEDULED,
        scheduledAt: new Date(Date.now() + 60000),
      } as Campaign;

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      jest.spyOn(service, 'executeCampaign').mockResolvedValue({
        campaignId: '1',
        success: true,
        recipientCount: 1,
        deliveredCount: 1,
        failedCount: 0,
      });

      await service.resumeCampaign('1');

      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('handleAppointmentEvent', () => {
    it('should trigger event-based campaigns', async () => {
      const eventData = {
        appointmentId: 'appointment1',
        customerId: 'customer1',
        tenantId: 'tenant1',
        eventType: 'appointment.created',
      };

      const mockCampaigns = [
        {
          id: '1',
          tenantId: 'tenant1',
          status: CampaignStatus.ACTIVE,
          triggerType: TriggerType.EVENT_BASED,
          eventTriggers: {
            events: ['appointment.created'],
            conditions: {},
            delay: 0,
          },
        } as Campaign,
      ];

      mockCampaignRepository.find.mockResolvedValue(mockCampaigns);
      jest.spyOn(service, 'executeCampaign').mockResolvedValue({
        campaignId: '1',
        success: true,
        recipientCount: 1,
        deliveredCount: 1,
        failedCount: 0,
      });

      await service.handleAppointmentEvent(eventData);

      expect(mockCampaignRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant1',
          status: CampaignStatus.ACTIVE,
          triggerType: TriggerType.EVENT_BASED,
        },
      });
      expect(service.executeCampaign).toHaveBeenCalledWith(mockCampaigns[0]);
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should return campaign analytics', async () => {
      const mockCampaign = {
        id: '1',
        sentCount: 100,
        deliveredCount: 95,
        openedCount: 50,
        clickedCount: 25,
        unsubscribedCount: 2,
        bounceCount: 5,
        createdAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
      } as Campaign;

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);

      const result = await service.getCampaignAnalytics('1');

      expect(result).toEqual({
        metrics: {
          sent: 100,
          delivered: 95,
          opened: 50,
          clicked: 25,
          unsubscribed: 2,
          bounced: 5,
        },
        performance: {
          deliveryRate: 95,
          openRate: 52.63,
          clickRate: 50,
          unsubscribeRate: 2.11,
          bounceRate: 5.26,
        },
        timeline: {
          created: mockCampaign.createdAt,
          started: mockCampaign.startedAt,
          completed: mockCampaign.completedAt,
        },
      });
    });
  });
});