import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CampaignsService,
  CreateCampaignDto,
  UpdateCampaignDto,
} from './campaigns.service';
import { CampaignExecutionProcessor } from './campaign-execution.processor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CampaignStatus, CampaignType } from './entities/campaign.entity';

@ApiTags('campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly campaignProcessor: CampaignExecutionProcessor,
  ) {}

  private getTenantId(req: any): string {
    const headers = (req?.headers || {}) as Record<string, string>;
    return (
      req?.tenant?.id ||
      headers['x-tenant-id'] ||
      req?.query?.tenantId ||
      req?.params?.tenantId ||
      'tenant1'
    );
  }

  private getUserId(req: any): string {
    return req?.user?.id || 'user1';
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns for tenant' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('status') status?: CampaignStatus,
    @Query('type') type?: CampaignType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const tenantId = this.getTenantId(req);
    return this.campaignsService.findAllForTenant(tenantId, {
      status,
      type,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid campaign data' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() dto: CreateCampaignDto) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.campaignsService.createForTenant(tenantId, dto, userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get campaign performance summary' })
  @ApiResponse({
    status: 200,
    description: 'Campaign summary retrieved successfully',
  })
  async getSummary(@Request() req) {
    const tenantId = this.getTenantId(req);
    return this.campaignsService.getCampaignSummary(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.campaignsService.findOneForTenant(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const tenantId = this.getTenantId(req);
    const userId = this.getUserId(req);
    return this.campaignsService.updateForTenant(tenantId, id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: 204, description: 'Campaign deleted successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async remove(@Request() req, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    await this.campaignsService.removeForTenant(tenantId, id);
  }

  @Post(':id/launch')
  @ApiOperation({ summary: 'Launch a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign launched successfully' })
  @ApiResponse({ status: 400, description: 'Campaign cannot be launched' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @HttpCode(HttpStatus.CREATED)
  async launch(@Request() req, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.campaignsService.launchCampaign(tenantId, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign paused successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @HttpCode(HttpStatus.CREATED)
  async pause(@Request() req, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.campaignsService.pauseCampaign(tenantId, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused campaign' })
  @ApiResponse({ status: 200, description: 'Campaign resumed successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  @HttpCode(HttpStatus.CREATED)
  async resume(@Request() req, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.campaignsService.resumeCampaign(tenantId, id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics' })
  @ApiResponse({
    status: 200,
    description: 'Campaign analytics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getAnalytics(@Request() req, @Param('id') id: string) {
    const tenantId = this.getTenantId(req);
    return this.campaignsService.getCampaignAnalytics(tenantId, id);
  }

  @Get('track/open/:campaignId/:recipientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track email open event' })
  @ApiResponse({ status: 200, description: 'Open event tracked successfully' })
  @Header('Content-Type', 'image/png')
  async trackOpen(
    @Param('campaignId') campaignId: string,
    @Param('recipientId') recipientId: string,
  ) {
    await this.campaignProcessor.handleTrackingEvent(
      campaignId,
      recipientId,
      'open',
    );

    // Return a 1x1 transparent pixel
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64',
    );
  }

  @Get('track/click/:campaignId/:recipientId')
  @ApiOperation({ summary: 'Track email click event and redirect' })
  @ApiResponse({
    status: 302,
    description: 'Click event tracked and redirected',
  })
  async trackClick(
    @Param('campaignId') campaignId: string,
    @Param('recipientId') recipientId: string,
    @Query('url') url: string,
  ) {
    await this.campaignProcessor.handleTrackingEvent(
      campaignId,
      recipientId,
      'click',
    );

    // Redirect to the original URL
    return { redirect: url || 'https://tekassist.com' };
  }

  @Post('track/unsubscribe/:campaignId/:recipientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track unsubscribe event' })
  @ApiResponse({
    status: 200,
    description: 'Unsubscribe event tracked successfully',
  })
  async trackUnsubscribe(
    @Param('campaignId') campaignId: string,
    @Param('recipientId') recipientId: string,
  ) {
    await this.campaignProcessor.handleTrackingEvent(
      campaignId,
      recipientId,
      'unsubscribe',
    );

    return { message: 'You have been successfully unsubscribed' };
  }
}
