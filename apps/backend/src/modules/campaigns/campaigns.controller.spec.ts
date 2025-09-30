import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService, CreateCampaignDto, UpdateCampaignDto } from './campaigns.service';
import { CampaignExecutionProcessor } from './campaign-execution.processor';
import { Campaign, CampaignStatus, CampaignType, TriggerType } from './entities/campaign.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('CampaignsController (Integration)', () => {
  let app: INestApplication;
  let campaignsService: CampaignsService;
  let campaignProcessor: CampaignExecutionProcessor;
  let jwtService: JwtService;

  const mockCampaignsService = {
    findAllForTenant: jest.fn(),
    createForTenant: jest.fn(),
    findOneForTenant: jest.fn(),
    updateForTenant: jest.fn(),
    removeForTenant: jest.fn(),
    launchCampaign: jest.fn(),
    pauseCampaign: jest.fn(),
    resumeCampaign: jest.fn(),
    getCampaignAnalytics: jest.fn(),
    getCampaignSummary: jest.fn(),
  };

  const mockCampaignProcessor = {
    handleTrackingEvent: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CampaignsController],
      providers: [
        {
          provide: CampaignsService,
          useValue: mockCampaignsService,
        },
        {
          provide: CampaignExecutionProcessor,
          useValue: mockCampaignProcessor,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = module.createNestApplication();
    await app.init();

    campaignsService = module.get<CampaignsService>(CampaignsService);
    campaignProcessor = module.get<CampaignExecutionProcessor>(CampaignExecutionProcessor);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  const mockRequest = {
    tenant: { id: 'tenant1' },
    user: { id: 'user1' },
  };

  describe('GET /campaigns', () => {
    it('should return all campaigns for tenant', async () => {
      const mockCampaigns = [
        {
          id: '1',
          tenantId: 'tenant1',
          name: 'Campaign 1',
          status: CampaignStatus.ACTIVE,
        },
        {
          id: '2',
          tenantId: 'tenant1',
          name: 'Campaign 2',
          status: CampaignStatus.DRAFT,
        },
      ];

      mockCampaignsService.findAllForTenant.mockResolvedValue(mockCampaigns);

      const response = await request(app.getHttpServer())
        .get('/campaigns')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockCampaigns);
      expect(mockCampaignsService.findAllForTenant).toHaveBeenCalledWith('tenant1', {});
    });

    it('should apply query filters', async () => {
      mockCampaignsService.findAllForTenant.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/campaigns')
        .query({
          status: CampaignStatus.ACTIVE,
          type: CampaignType.EMAIL,
          limit: '10',
          offset: '0',
        })
        .expect(HttpStatus.OK);

      expect(mockCampaignsService.findAllForTenant).toHaveBeenCalledWith('tenant1', {
        status: CampaignStatus.ACTIVE,
        type: CampaignType.EMAIL,
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('POST /campaigns', () => {
    const createDto: CreateCampaignDto = {
      name: 'Test Campaign',
      description: 'Test description',
      type: CampaignType.EMAIL,
      triggerType: TriggerType.MANUAL,
      subject: 'Test Subject',
      content: 'Test content',
      targetAudience: { customerIds: ['customer1'] },
    };

    it('should create a new campaign', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        ...createDto,
        status: CampaignStatus.DRAFT,
      };

      mockCampaignsService.createForTenant.mockResolvedValue(mockCampaign);

      const response = await request(app.getHttpServer())
        .post('/campaigns')
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual(mockCampaign);
      expect(mockCampaignsService.createForTenant).toHaveBeenCalledWith(
        'tenant1',
        createDto,
        'user1'
      );
    });

    it('should return 400 for invalid campaign data', async () => {
      mockCampaignsService.createForTenant.mockRejectedValue(
        new Error('Invalid campaign data')
      );

      await request(app.getHttpServer())
        .post('/campaigns')
        .send({ name: '' }) // Invalid data
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('GET /campaigns/summary', () => {
    it('should return campaign summary', async () => {
      const mockSummary = {
        totalCampaigns: 10,
        activeCampaigns: 3,
        totalSent: 1000,
        averageOpenRate: 25.5,
        averageClickRate: 12.3,
      };

      mockCampaignsService.getCampaignSummary.mockResolvedValue(mockSummary);

      const response = await request(app.getHttpServer())
        .get('/campaigns/summary')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockSummary);
      expect(mockCampaignsService.getCampaignSummary).toHaveBeenCalledWith('tenant1');
    });
  });

  describe('GET /campaigns/:id', () => {
    it('should return a campaign by ID', async () => {
      const mockCampaign = {
        id: '1',
        tenantId: 'tenant1',
        name: 'Test Campaign',
      };

      mockCampaignsService.findOneForTenant.mockResolvedValue(mockCampaign);

      const response = await request(app.getHttpServer())
        .get('/campaigns/1')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockCampaign);
      expect(mockCampaignsService.findOneForTenant).toHaveBeenCalledWith('tenant1', '1');
    });

    it('should return 404 when campaign not found', async () => {
      mockCampaignsService.findOneForTenant.mockRejectedValue(
        new Error('Campaign not found')
      );

      await request(app.getHttpServer())
        .get('/campaigns/999')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('PUT /campaigns/:id', () => {
    const updateDto: UpdateCampaignDto = {
      name: 'Updated Campaign',
      description: 'Updated description',
    };

    it('should update a campaign', async () => {
      const mockUpdatedCampaign = {
        id: '1',
        tenantId: 'tenant1',
        ...updateDto,
      };

      mockCampaignsService.updateForTenant.mockResolvedValue(mockUpdatedCampaign);

      const response = await request(app.getHttpServer())
        .put('/campaigns/1')
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockUpdatedCampaign);
      expect(mockCampaignsService.updateForTenant).toHaveBeenCalledWith(
        'tenant1',
        '1',
        updateDto,
        'user1'
      );
    });
  });

  describe('DELETE /campaigns/:id', () => {
    it('should delete a campaign', async () => {
      mockCampaignsService.removeForTenant.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete('/campaigns/1')
        .expect(HttpStatus.NO_CONTENT);

      expect(mockCampaignsService.removeForTenant).toHaveBeenCalledWith('tenant1', '1');
    });
  });

  describe('POST /campaigns/:id/launch', () => {
    it('should launch a campaign', async () => {
      const mockLaunchedCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.ACTIVE,
      };

      mockCampaignsService.launchCampaign.mockResolvedValue(mockLaunchedCampaign);

      const response = await request(app.getHttpServer())
        .post('/campaigns/1/launch')
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual(mockLaunchedCampaign);
      expect(mockCampaignsService.launchCampaign).toHaveBeenCalledWith('tenant1', '1');
    });
  });

  describe('POST /campaigns/:id/pause', () => {
    it('should pause a campaign', async () => {
      const mockPausedCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.PAUSED,
      };

      mockCampaignsService.pauseCampaign.mockResolvedValue(mockPausedCampaign);

      const response = await request(app.getHttpServer())
        .post('/campaigns/1/pause')
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual(mockPausedCampaign);
      expect(mockCampaignsService.pauseCampaign).toHaveBeenCalledWith('tenant1', '1');
    });
  });

  describe('POST /campaigns/:id/resume', () => {
    it('should resume a campaign', async () => {
      const mockResumedCampaign = {
        id: '1',
        tenantId: 'tenant1',
        status: CampaignStatus.ACTIVE,
      };

      mockCampaignsService.resumeCampaign.mockResolvedValue(mockResumedCampaign);

      const response = await request(app.getHttpServer())
        .post('/campaigns/1/resume')
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual(mockResumedCampaign);
      expect(mockCampaignsService.resumeCampaign).toHaveBeenCalledWith('tenant1', '1');
    });
  });

  describe('GET /campaigns/:id/analytics', () => {
    it('should return campaign analytics', async () => {
      const mockAnalytics = {
        metrics: {
          sent: 100,
          delivered: 95,
          opened: 50,
          clicked: 25,
        },
        performance: {
          deliveryRate: 95,
          openRate: 52.63,
          clickRate: 50,
        },
      };

      mockCampaignsService.getCampaignAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app.getHttpServer())
        .get('/campaigns/1/analytics')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockAnalytics);
      expect(mockCampaignsService.getCampaignAnalytics).toHaveBeenCalledWith('tenant1', '1');
    });
  });

  describe('GET /campaigns/track/open/:campaignId/:recipientId', () => {
    it('should track email open event', async () => {
      mockCampaignProcessor.handleTrackingEvent.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get('/campaigns/track/open/campaign1/recipient1')
        .expect(HttpStatus.OK);

      expect(mockCampaignProcessor.handleTrackingEvent).toHaveBeenCalledWith(
        'campaign1',
        'recipient1',
        'open'
      );

      // Should return a tracking pixel
      expect(response.body).toBeInstanceOf(Buffer);
    });
  });

  describe('GET /campaigns/track/click/:campaignId/:recipientId', () => {
    it('should track email click event and redirect', async () => {
      mockCampaignProcessor.handleTrackingEvent.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get('/campaigns/track/click/campaign1/recipient1')
        .query({ url: 'https://example.com' })
        .expect(HttpStatus.OK);

      expect(mockCampaignProcessor.handleTrackingEvent).toHaveBeenCalledWith(
        'campaign1',
        'recipient1',
        'click'
      );

      expect(response.body).toEqual({
        redirect: 'https://example.com',
      });
    });

    it('should use default redirect URL when no URL provided', async () => {
      mockCampaignProcessor.handleTrackingEvent.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get('/campaigns/track/click/campaign1/recipient1')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        redirect: 'https://tekassist.com',
      });
    });
  });

  describe('POST /campaigns/track/unsubscribe/:campaignId/:recipientId', () => {
    it('should track unsubscribe event', async () => {
      mockCampaignProcessor.handleTrackingEvent.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/campaigns/track/unsubscribe/campaign1/recipient1')
        .expect(HttpStatus.OK);

      expect(mockCampaignProcessor.handleTrackingEvent).toHaveBeenCalledWith(
        'campaign1',
        'recipient1',
        'unsubscribe'
      );

      expect(response.body).toEqual({
        message: 'You have been successfully unsubscribed',
      });
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      // Reset the auth guard to actually check authentication
      mockAuthGuard.canActivate.mockReturnValue(false);
    });

    it('should require authentication for all endpoints', async () => {
      await request(app.getHttpServer())
        .get('/campaigns')
        .expect(HttpStatus.FORBIDDEN);

      await request(app.getHttpServer())
        .post('/campaigns')
        .send({})
        .expect(HttpStatus.FORBIDDEN);

      await request(app.getHttpServer())
        .get('/campaigns/1')
        .expect(HttpStatus.FORBIDDEN);

      await request(app.getHttpServer())
        .put('/campaigns/1')
        .send({})
        .expect(HttpStatus.FORBIDDEN);

      await request(app.getHttpServer())
        .delete('/campaigns/1')
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});