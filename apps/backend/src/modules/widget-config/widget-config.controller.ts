import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { WidgetConfigService } from './widget-config.service';
import { CreateWidgetConfigDto } from './dto/create-widget-config.dto';
import { UpdateWidgetConfigDto } from './dto/update-widget-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('widget-config')
export class WidgetConfigController {
  constructor(private readonly widgetConfigService: WidgetConfigService) {}

  @Post()
  @UseGuards(JwtAuthGuard, TenantGuard)
  create(@Body() createWidgetConfigDto: CreateWidgetConfigDto, @Req() req: any) {
    return this.widgetConfigService.create({
      ...createWidgetConfigDto,
      tenantId: req.tenant.id,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, TenantGuard)
  findByTenant(@Req() req: any) {
    return this.widgetConfigService.findOrCreateByTenant(req.tenant.id);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, TenantGuard)
  update(@Body() updateWidgetConfigDto: UpdateWidgetConfigDto, @Req() req: any) {
    return this.widgetConfigService.update(req.tenant.id, updateWidgetConfigDto);
  }

  @Patch('toggle')
  @UseGuards(JwtAuthGuard, TenantGuard)
  toggleActive(@Req() req: any) {
    return this.widgetConfigService.toggleActive(req.tenant.id);
  }

  @Get('embed-code')
  @UseGuards(JwtAuthGuard, TenantGuard)
  getEmbedCode(@Req() req: any, @Query('domain') domain?: string) {
    return this.widgetConfigService.generateEmbedCode(req.tenant.id, domain);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, TenantGuard)
  remove(@Req() req: any) {
    return this.widgetConfigService.remove(req.tenant.id);
  }

  // Public endpoints for widget embedding
  @Get('public/:tenantId')
  @Public()
  async getPublicConfig(@Param('tenantId') tenantId: string) {
    try {
      return await this.widgetConfigService.getPublicConfig(tenantId);
    } catch (error) {
      // Return default config if tenant doesn't exist
      return {
        title: 'Chat with us',
        welcomeMessage: 'Hello! How can we help you today?',
        placeholder: 'Type your message...',
        position: 'bottom-right',
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#EFF6FF',
          textColor: '#1F2937',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          buttonColor: '#3B82F6',
          buttonTextColor: '#FFFFFF',
          headerColor: '#3B82F6',
          headerTextColor: '#FFFFFF',
        },
        branding: {
          showPoweredBy: true,
        },
        behavior: {
          autoOpen: false,
          autoOpenDelay: 3000,
          enableSound: true,
          enableTypingIndicator: true,
          maxHeight: '600px',
          maxWidth: '400px',
        },
        version: 'v1',
      };
    }
  }

  @Get('embed/:tenantId')
  @Public()
  async getEmbedCodePublic(
    @Param('tenantId') tenantId: string,
    @Query('domain') domain?: string,
  ) {
    try {
      return await this.widgetConfigService.generateEmbedCode(tenantId, domain);
    } catch (error) {
      // Return default embed code if tenant doesn't exist
      const baseUrl = process.env.WIDGET_CDN_URL || process.env.BASE_URL || 'http://localhost:3002';
      
      return `
<!-- TekAssist Chat Widget -->
<script>
  (function() {
    window.TekAssistConfig = {
      tenantId: '${tenantId}',
      apiUrl: '${baseUrl}/api',
      widgetUrl: '${baseUrl}/widget'
    };
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget/embed.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
<!-- End TekAssist Chat Widget -->`.trim();
    }
  }
}