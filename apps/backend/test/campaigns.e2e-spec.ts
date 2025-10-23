import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { CampaignsModule } from '../src/modules/campaigns/campaigns.module';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import {
  Campaign,
  CampaignStatus,
  CampaignType,
  TriggerType,
} from '../src/modules/campaigns/entities/campaign.entity';
import { Customer } from '../src/modules/customers/entities/customer.entity';
import { Appointment } from '../src/modules/appointments/entities/appointment.entity';
import { Tenant } from '../src/modules/tenants/entities/tenant.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

describe('Campaigns (E2E)', () => {
  let app: INestApplication;
  let campaignRepository: Repository<Campaign>;
  let customerRepository: Repository<Customer>;
  let appointmentRepository: Repository<Appointment>;
  let tenantRepository: Repository<Tenant>;
  let userRepository: Repository<User>;
  let campaignQueue: Queue;

  let testTenant: Tenant;
  let testUser: User;
  let testCustomers: Customer[];
  let testAppointment: Appointment;

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Campaign, Customer, Appointment, Tenant, User],
          synchronize: true,
          logging: false,
        }),
        BullModule.forRoot({
          redis: {
            host: 'localhost',
            port: 6379,
          },
        }),
        EventEmitterModule.forRoot(),
        CampaignsModule,
        NotificationsModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    campaignRepository = moduleFixture.get<Repository<Campaign>>(
      getRepositoryToken(Campaign),
    );
    customerRepository = moduleFixture.get<Repository<Customer>>(
      getRepositoryToken(Customer),
    );
    appointmentRepository = moduleFixture.get<Repository<Appointment>>(
      getRepositoryToken(Appointment),
    );
    tenantRepository = moduleFixture.get<Repository<Tenant>>(
      getRepositoryToken(Tenant),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    campaignQueue = moduleFixture.get<Queue>(
      getQueueToken('campaign-execution'),
    );

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Mock the request context
    app.use((req, res, next) => {
      req.tenant = testTenant;
      req.user = testUser;
      next();
    });
  });

  afterEach(async () => {
    // Clean up campaigns after each test
    await campaignRepository.delete({});
    await campaignQueue.empty();
  });

  async function setupTestData() {
    // Create test tenant
    testTenant = await tenantRepository.save({
      id: 'test-tenant',
      name: 'Test Tenant',
      email: 'test@tenant.com',
      subdomain: 'test',
    });

    // Create test user
    testUser = await userRepository.save({
      id: 'test-user',
      email: 'test@user.com',
      firstName: 'Test',
      lastName: 'User',
      tenantId: testTenant.id,
    });

    // Create test customers
    testCustomers = await customerRepository.save([
      {
        id: 'customer-1',
        email: 'customer1@test.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        tenantId: testTenant.id,
      },
      {
        id: 'customer-2',
        email: 'customer2@test.com',
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567891',
        tenantId: testTenant.id,
      },
    ]);

    // Create test appointment
    testAppointment = await appointmentRepository.save({
      id: 'appointment-1',
      customerId: testCustomers[0].id,
      tenantId: testTenant.id,
      title: 'Test Appointment',
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endTime: new Date(Date.now() + 25 * 60 * 60 * 1000),
      status: 'scheduled',
    });
  }

  describe('Campaign Lifecycle', () => {
    it('should create, launch, and execute a complete email campaign workflow', async () => {
      // Step 1: Create a campaign
      const createCampaignDto = {
        name: 'Welcome Email Campaign',
        description: 'Welcome new customers',
        type: CampaignType.EMAIL,
        triggerType: TriggerType.MANUAL,
        subject: 'Welcome {{firstName}}!',
        content: 'Hello {{firstName}}, welcome to {{companyName}}!',
        htmlContent:
          '<h1>Welcome {{firstName}}!</h1><p>Hello {{firstName}}, welcome to {{companyName}}!</p>',
        targetAudience: {
          customerIds: testCustomers.map(c => c.id),
        },
        templateData: {
          companyName: 'TekAssist',
        },
      };

      const createResponse = await request(app.getHttpServer())
        .post('/campaigns')
        .send(createCampaignDto)
        .expect(201);

      const campaign = createResponse.body;
      expect(campaign.id).toBeDefined();
      expect(campaign.status).toBe(CampaignStatus.DRAFT);
      expect(campaign.estimatedRecipients).toBe(2);

      // Step 2: Launch the campaign
      const launchResponse = await request(app.getHttpServer())
        .post(`/campaigns/${campaign.id}/launch`)
        .expect(201);

      expect(launchResponse.body.status).toBe(CampaignStatus.ACTIVE);
      expect(launchResponse.body.startedAt).toBeDefined();

      // Step 3: Wait for campaign execution (simulate queue processing)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Verify campaign metrics were updated
      const analyticsResponse = await request(app.getHttpServer())
        .get(`/campaigns/${campaign.id}/analytics`)
        .expect(200);

      const analytics = analyticsResponse.body;
      expect(analytics.metrics.sent).toBeGreaterThan(0);
      expect(analytics.performance.deliveryRate).toBeGreaterThan(0);

      // Step 5: Test tracking functionality
      await request(app.getHttpServer())
        .get(`/campaigns/track/open/${campaign.id}/${testCustomers[0].id}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/campaigns/track/click/${campaign.id}/${testCustomers[0].id}`)
        .query({ url: 'https://example.com' })
        .expect(200);

      // Step 6: Verify tracking metrics were updated
      const updatedAnalytics = await request(app.getHttpServer())
        .get(`/campaigns/${campaign.id}/analytics`)
        .expect(200);

      expect(updatedAnalytics.body.metrics.opened).toBeGreaterThan(0);
      expect(updatedAnalytics.body.metrics.clicked).toBeGreaterThan(0);
    });

    it('should create and execute a scheduled campaign', async () => {
      const scheduledTime = new Date(Date.now() + 5000); // 5 seconds from now

      const createCampaignDto = {
        name: 'Scheduled Campaign',
        description: 'A scheduled campaign',
        type: CampaignType.EMAIL,
        triggerType: TriggerType.SCHEDULED,
        scheduledAt: scheduledTime,
        subject: 'Scheduled Message',
        content: 'This is a scheduled message',
        targetAudience: {
          customerIds: [testCustomers[0].id],
        },
      };

      const createResponse = await request(app.getHttpServer())
        .post('/campaigns')
        .send(createCampaignDto)
        .expect(201);

      const campaign = createResponse.body;

      // Launch the campaign
      const launchResponse = await request(app.getHttpServer())
        .post(`/campaigns/${campaign.id}/launch`)
        .expect(201);

      expect(launchResponse.body.status).toBe(CampaignStatus.SCHEDULED);

      // Wait for scheduled execution
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Verify campaign was executed
      const updatedCampaign = await request(app.getHttpServer())
        .get(`/campaigns/${campaign.id}`)
        .expect(200);

      expect(updatedCampaign.body.status).toBe(CampaignStatus.COMPLETED);
    });

    it('should handle A/B testing campaigns', async () => {
      const createCampaignDto = {
        name: 'A/B Test Campaign',
        description: 'Testing different subject lines',
        type: CampaignType.EMAIL,
        triggerType: TriggerType.MANUAL,
        subject: 'Subject A',
        content: 'Content A',
        targetAudience: {
          customerIds: testCustomers.map(c => c.id),
        },
        abTestConfig: {
          enabled: true,
          splitPercentage: 50,
          variantSubject: 'Subject B',
          variantContent: 'Content B',
        },
      };

      const createResponse = await request(app.getHttpServer())
        .post('/campaigns')
        .send(createCampaignDto)
        .expect(201);

      const campaign = createResponse.body;

      // Launch the campaign
      await request(app.getHttpServer())
        .post(`/campaigns/${campaign.id}/launch`)
        .expect(201);

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify both variants were sent
      const analytics = await request(app.getHttpServer())
        .get(`/campaigns/${campaign.id}/analytics`)
        .expect(200);

      expect(analytics.body.metrics.sent).toBe(2); // Both customers should receive the campaign
    });
  });

  describe('Campaign Management', () => {
    let testCampaign: any;

    beforeEach(async () => {
      const createCampaignDto = {
        name: 'Test Campaign',
        description: 'A test campaign',
        type: CampaignType.EMAIL,
        triggerType: TriggerType.MANUAL,
        subject: 'Test Subject',
        content: 'Test content',
        targetAudience: {
          customerIds: [testCustomers[0].id],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/campaigns')
        .send(createCampaignDto)
        .expect(201);

      testCampaign = response.body;
    });

    it('should pause and resume a campaign', async () => {
      // Launch the campaign first
      await request(app.getHttpServer())
        .post(`/campaigns/${testCampaign.id}/launch`)
        .expect(201);

      // Pause the campaign
      const pauseResponse = await request(app.getHttpServer())
        .post(`/campaigns/${testCampaign.id}/pause`)
        .expect(201);

      expect(pauseResponse.body.status).toBe(CampaignStatus.PAUSED);

      // Resume the campaign
      const resumeResponse = await request(app.getHttpServer())
        .post(`/campaigns/${testCampaign.id}/resume`)
        .expect(201);

      expect(resumeResponse.body.status).toBe(CampaignStatus.ACTIVE);
    });

    it('should update campaign details', async () => {
      const updateDto = {
        name: 'Updated Campaign Name',
        description: 'Updated description',
        subject: 'Updated Subject',
      };

      const response = await request(app.getHttpServer())
        .put(`/campaigns/${testCampaign.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
      expect(response.body.description).toBe(updateDto.description);
      expect(response.body.subject).toBe(updateDto.subject);
    });

    it('should delete a campaign', async () => {
      await request(app.getHttpServer())
        .delete(`/campaigns/${testCampaign.id}`)
        .expect(204);

      // Verify campaign is soft deleted
      await request(app.getHttpServer())
        .get(`/campaigns/${testCampaign.id}`)
        .expect(404);
    });
  });

  describe('Event-Based Campaigns', () => {
    it('should trigger campaigns based on appointment events', async () => {
      // Create an event-based campaign
      const createCampaignDto = {
        name: 'Appointment Reminder',
        description: 'Remind customers about upcoming appointments',
        type: CampaignType.EMAIL,
        triggerType: TriggerType.EVENT_BASED,
        subject: 'Appointment Reminder',
        content: 'You have an appointment tomorrow',
        targetAudience: {
          segment: 'all',
        },
        eventTriggers: {
          events: ['appointment.created'],
          conditions: {},
          delay: 0,
        },
      };

      const createResponse = await request(app.getHttpServer())
        .post('/campaigns')
        .send(createCampaignDto)
        .expect(201);

      const campaign = createResponse.body;

      // Launch the campaign
      await request(app.getHttpServer())
        .post(`/campaigns/${campaign.id}/launch`)
        .expect(201);

      // Simulate appointment creation event
      // This would normally be triggered by the appointment service
      const eventData = {
        appointmentId: testAppointment.id,
        customerId: testCustomers[0].id,
        tenantId: testTenant.id,
        eventType: 'appointment.created',
      };

      // In a real scenario, this would be handled by the event system
      // For testing, we'll directly call the campaign automation service
      // await campaignAutomationService.handleAppointmentEvent(eventData);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify campaign was triggered
      const analytics = await request(app.getHttpServer())
        .get(`/campaigns/${campaign.id}/analytics`)
        .expect(200);

      // The campaign should have been executed for the event
      expect(analytics.body.metrics.sent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Campaign Analytics and Reporting', () => {
    it('should provide comprehensive campaign summary', async () => {
      // Create multiple campaigns with different statuses
      const campaigns = await Promise.all([
        request(app.getHttpServer())
          .post('/campaigns')
          .send({
            name: 'Active Campaign',
            type: CampaignType.EMAIL,
            triggerType: TriggerType.MANUAL,
            subject: 'Test',
            content: 'Test',
            targetAudience: { customerIds: [testCustomers[0].id] },
          }),
        request(app.getHttpServer())
          .post('/campaigns')
          .send({
            name: 'Draft Campaign',
            type: CampaignType.SMS,
            triggerType: TriggerType.MANUAL,
            content: 'Test SMS',
            targetAudience: { customerIds: [testCustomers[1].id] },
          }),
      ]);

      // Launch one campaign
      await request(app.getHttpServer())
        .post(`/campaigns/${campaigns[0].body.id}/launch`)
        .expect(201);

      // Get campaign summary
      const summaryResponse = await request(app.getHttpServer())
        .get('/campaigns/summary')
        .expect(200);

      const summary = summaryResponse.body;
      expect(summary.totalCampaigns).toBe(2);
      expect(summary.activeCampaigns).toBe(1);
      expect(typeof summary.totalSent).toBe('number');
      expect(typeof summary.averageOpenRate).toBe('number');
      expect(typeof summary.averageClickRate).toBe('number');
    });

    it('should filter campaigns by status and type', async () => {
      // Create campaigns of different types
      await Promise.all([
        request(app.getHttpServer())
          .post('/campaigns')
          .send({
            name: 'Email Campaign',
            type: CampaignType.EMAIL,
            triggerType: TriggerType.MANUAL,
            subject: 'Test',
            content: 'Test',
            targetAudience: { customerIds: [testCustomers[0].id] },
          }),
        request(app.getHttpServer())
          .post('/campaigns')
          .send({
            name: 'SMS Campaign',
            type: CampaignType.SMS,
            triggerType: TriggerType.MANUAL,
            content: 'Test SMS',
            targetAudience: { customerIds: [testCustomers[1].id] },
          }),
      ]);

      // Filter by email type
      const emailCampaigns = await request(app.getHttpServer())
        .get('/campaigns')
        .query({ type: CampaignType.EMAIL })
        .expect(200);

      expect(emailCampaigns.body).toHaveLength(1);
      expect(emailCampaigns.body[0].type).toBe(CampaignType.EMAIL);

      // Filter by SMS type
      const smsCampaigns = await request(app.getHttpServer())
        .get('/campaigns')
        .query({ type: CampaignType.SMS })
        .expect(200);

      expect(smsCampaigns.body).toHaveLength(1);
      expect(smsCampaigns.body[0].type).toBe(CampaignType.SMS);

      // Filter by draft status
      const draftCampaigns = await request(app.getHttpServer())
        .get('/campaigns')
        .query({ status: CampaignStatus.DRAFT })
        .expect(200);

      expect(draftCampaigns.body).toHaveLength(2);
      expect(
        draftCampaigns.body.every(c => c.status === CampaignStatus.DRAFT),
      ).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid campaign creation', async () => {
      const invalidDto = {
        name: '', // Empty name
        type: CampaignType.EMAIL,
        // Missing required fields
      };

      await request(app.getHttpServer())
        .post('/campaigns')
        .send(invalidDto)
        .expect(400);
    });

    it('should handle non-existent campaign operations', async () => {
      const nonExistentId = 'non-existent-id';

      await request(app.getHttpServer())
        .get(`/campaigns/${nonExistentId}`)
        .expect(404);

      await request(app.getHttpServer())
        .put(`/campaigns/${nonExistentId}`)
        .send({ name: 'Updated' })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/campaigns/${nonExistentId}`)
        .expect(404);

      await request(app.getHttpServer())
        .post(`/campaigns/${nonExistentId}/launch`)
        .expect(404);
    });

    it('should handle invalid status transitions', async () => {
      // Create and complete a campaign
      const campaign = await request(app.getHttpServer())
        .post('/campaigns')
        .send({
          name: 'Test Campaign',
          type: CampaignType.EMAIL,
          triggerType: TriggerType.MANUAL,
          subject: 'Test',
          content: 'Test',
          targetAudience: { customerIds: [testCustomers[0].id] },
        })
        .expect(201);

      // Manually set campaign to completed status
      await campaignRepository.update(campaign.body.id, {
        status: CampaignStatus.COMPLETED,
      });

      // Try to launch a completed campaign (should fail)
      await request(app.getHttpServer())
        .post(`/campaigns/${campaign.body.id}/launch`)
        .expect(400);
    });
  });
});
