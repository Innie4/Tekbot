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
import { NotificationService } from '../notifications/notification.service';
import { reminderConfig } from '../appointments/config';

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
        totalRecipients: 100,
        sentCount: 95,
        failedCount: 5,
        errors: [],
      });

      await service.processScheduledCampaigns();

      expect(mockCampaignRepository.find).toHaveBeenCalledWith({
        where: {
          status: CampaignStatus.SCHEDULED,
          triggerType: TriggerType.SCHEDULED,
          scheduledAt: expect.any(Object),
        },
      });
      expect(service.executeCampaign).toHaveBeenCalledWith(mockCampaign.id);
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

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.executeCampaign(mockCampaign.id);

      expect(result).toEqual({
          campaignId: '1',
          totalRecipients: 1,
          sentCount: 1,
          failedCount: 0,
          errors: [],
        });
      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCampaign.id },
        relations: ['tenant'],
      });
    });

    it('should handle A/B testing campaigns', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        name: 'Test Campaign',
        status: CampaignStatus.ACTIVE,
        type: CampaignType.EMAIL,
        triggerType: TriggerType.MANUAL,
        targetAudience: { customerIds: ['customer1', 'customer2'] },
        subject: 'Test Campaign',
        content: 'Test content',
        estimatedRecipients: 2,
        sentCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        unsubscribedCount: 0,
        bouncedCount: 0,
        failedCount: 0,
        created_at: new Date(),
        updated_at: new Date(),
        active: true,
        tenant: null,
        abTestConfig: {
          enabled: true,
          variants: [
            {
              id: 'variant-1',
              name: 'Variant A',
              percentage: 50,
              subject: 'Test Subject A',
              content: 'Test Content A'
            },
            {
              id: 'variant-2',
              name: 'Variant B',
              percentage: 50,
              subject: 'Test Subject B',
              content: 'Test Content B'
            }
          ],
          winnerCriteria: 'open_rate' as const,
          testDuration: 24
        },
      } as Campaign;

      const mockCustomers = [
        { id: 'customer1', email: 'test1@example.com', firstName: 'John' },
        { id: 'customer2', email: 'test2@example.com', firstName: 'Jane' },
      ];

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);
      mockCustomerRepository.find.mockResolvedValue(mockCustomers);

      const result = await service.executeCampaign(mockCampaign.id);

      expect(result).toEqual({
        campaignId: '1',
        totalRecipients: 2,
        sentCount: 2,
        failedCount: 0,
        errors: [],
       });
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
        totalRecipients: 100,
        sentCount: 95,
        failedCount: 5,
        errors: [],
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
        id: 'appointment-1',
        tenantId: 'tenant1',
        customerId: 'customer1',
        staffId: 'staff1',
        serviceId: 'service1',
        start_time: new Date(),
        end_time: new Date(),
        status: 'scheduled',
        created_at: new Date(),
        updated_at: new Date(),
      } as Appointment;

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
        totalRecipients: 100,
        sentCount: 95,
        failedCount: 5,
        errors: [],
      });

      await service.handleAppointmentCreated(eventData);

      expect(mockCampaignRepository.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant1',
          status: CampaignStatus.ACTIVE,
          triggerType: TriggerType.EVENT_BASED,
        },
      });
      expect(service.executeCampaign).toHaveBeenCalledWith(mockCampaigns[0].id);
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should return campaign analytics', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant-1',
        name: 'Test Campaign',
        type: CampaignType.EMAIL,
        status: CampaignStatus.ACTIVE,
        triggerType: TriggerType.MANUAL,
        subject: 'Test Subject',
        content: 'Test Content',
        estimatedRecipients: 100,
        sentCount: 50,
        deliveredCount: 45,
        openedCount: 20,
        clickedCount: 10,
        unsubscribedCount: 1,
        bouncedCount: 2,
        failedCount: 3,
        created_at: new Date(),
        updated_at: new Date(),
        startedAt: new Date(),
        completedAt: new Date(),
      } as Campaign;

      mockCampaignRepository.findOne.mockResolvedValue(mockCampaign);

      const result = await service.getCampaignAnalytics('1');

      expect(result).toEqual({
        metrics: {
          sent: 50,
          delivered: 45,
          opened: 20,
          clicked: 10,
          unsubscribed: 1,
          bounced: 2,
          failed: 3,
        },
        performance: {
          deliveryRate: 90,
          openRate: 44.44,
          clickRate: 50,
          unsubscribeRate: 2.22,
          bounceRate: 4.44,
        },
        timeline: {
          created: mockCampaign.created_at,
          started: mockCampaign.startedAt,
          completed: mockCampaign.completedAt,
        },
      });
    });
  });
});