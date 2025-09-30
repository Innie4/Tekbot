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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService, CreateCampaignDto, UpdateCampaignDto } from './campaigns.service';
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
    return this.campaignsService.findAllForTenant(req.tenant.id, {
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
  async create(@Request() req, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.createForTenant(req.tenant.id, dto, req.user.id);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get campaign performance summary' })
  @ApiResponse({ status: 200, description: 'Campaign summary retrieved successfully' })
  async getSummary(@Request() req) {
    return this.campaignsService.getCampaignSummary(req.tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign by ID' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.campaignsService.findOneForTenant(req.tenant.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid update data' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.updateForTenant(req.tenant.id, id, dto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiResponse({ status: 204, description: 'Campaign deleted successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.campaignsService.removeForTenant(req.tenant.id, id);
  }

  @Post(':id/launch')
  @ApiOperation({ summary: 'Launch a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign launched successfully' })
  @ApiResponse({ status: 400, description: 'Campaign cannot be launched' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async launch(@Request() req, @Param('id') id: string) {
    return this.campaignsService.launchCampaign(req.tenant.id, id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a campaign' })
  @ApiResponse({ status: 200, description: 'Campaign paused successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async pause(@Request() req, @Param('id') id: string) {
    return this.campaignsService.pauseCampaign(req.tenant.id, id);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Resume a paused campaign' })
  @ApiResponse({ status: 200, description: 'Campaign resumed successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async resume(@Request() req, @Param('id') id: string) {
    return this.campaignsService.resumeCampaign(req.tenant.id, id);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics' })
  @ApiResponse({ status: 200, description: 'Campaign analytics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getAnalytics(@Request() req, @Param('id') id: string) {
    return this.campaignsService.getCampaignAnalytics(req.tenant.id, id);
  }

  @Get('track/open/:campaignId/:recipientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track email open event' })
  @ApiResponse({ status: 200, description: 'Open event tracked successfully' })
  async trackOpen(
    @Param('campaignId') campaignId: string,
    @Param('recipientId') recipientId: string,
  ) {
    await this.campaignProcessor.handleTrackingEvent(campaignId, recipientId, 'open');
    
    // Return a 1x1 transparent pixel
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
  }

  @Get('track/click/:campaignId/:recipientId')
  @ApiOperation({ summary: 'Track email click event and redirect' })
  @ApiResponse({ status: 302, description: 'Click event tracked and redirected' })
  async trackClick(
    @Param('campaignId') campaignId: string,
    @Param('recipientId') recipientId: string,
    @Query('url') url: string,
  ) {
    await this.campaignProcessor.handleTrackingEvent(campaignId, recipientId, 'click');
    
    // Redirect to the original URL
    return { redirect: url || 'https://tekassist.com' };
  }

  @Post('track/unsubscribe/:campaignId/:recipientId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track unsubscribe event' })
  @ApiResponse({ status: 200, description: 'Unsubscribe event tracked successfully' })
  async trackUnsubscribe(
    @Param('campaignId') campaignId: string,
    @Param('recipientId') recipientId: string,
  ) {
    await this.campaignProcessor.handleTrackingEvent(campaignId, recipientId, 'unsubscribe');
    
    return { message: 'You have been successfully unsubscribed' };
  }
}
