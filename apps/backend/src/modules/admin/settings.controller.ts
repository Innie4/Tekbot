import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../tenants/guards/tenant.guard';
import { TenantsService } from '../tenants/tenants.service';

class GeneralSettingsDto {
  siteName!: string;
  siteDescription!: string;
  enableNotifications!: boolean;
  darkMode!: boolean;
  enableAnalytics!: boolean;
}

class ApiSettingsDto {
  apiKey!: string;
  maxTokens!: string;
  temperature!: string;
  enableRateLimiting!: boolean;
  rateLimitPerMinute!: string;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('general')
  @Roles('tenant_admin')
  @ApiOperation({ summary: 'Get general settings for current tenant' })
  @ApiResponse({ status: 200, description: 'General settings retrieved successfully' })
  async getGeneral(@Req() req: any): Promise<GeneralSettingsDto> {
    const tenant = await this.tenantsService.findOne(req.tenant.id);
    const defaults: GeneralSettingsDto = {
      siteName: '',
      siteDescription: '',
      enableNotifications: true,
      darkMode: true,
      enableAnalytics: true,
    };
    const current = (tenant.settings?.general ?? {}) as Partial<GeneralSettingsDto>;
    return { ...defaults, ...current };
  }

  @Put('general')
  @Roles('tenant_admin')
  @ApiOperation({ summary: 'Update general settings for current tenant' })
  @ApiResponse({ status: 200, description: 'General settings updated successfully' })
  async updateGeneral(@Req() req: any, @Body() dto: GeneralSettingsDto) {
    await this.tenantsService.updateSettings(req.tenant.id, { general: dto });
    const updated = await this.tenantsService.findOne(req.tenant.id);
    return updated.settings?.general ?? dto;
  }

  @Get('api')
  @Roles('tenant_admin')
  @ApiOperation({ summary: 'Get API settings for current tenant' })
  @ApiResponse({ status: 200, description: 'API settings retrieved successfully' })
  async getApi(@Req() req: any): Promise<ApiSettingsDto> {
    const tenant = await this.tenantsService.findOne(req.tenant.id);
    const defaults: ApiSettingsDto = {
      apiKey: '',
      maxTokens: '2048',
      temperature: '0.7',
      enableRateLimiting: true,
      rateLimitPerMinute: '60',
    };
    const current = (tenant.settings?.api ?? {}) as Partial<ApiSettingsDto>;
    return { ...defaults, ...current };
  }

  @Put('api')
  @Roles('tenant_admin')
  @ApiOperation({ summary: 'Update API settings for current tenant' })
  @ApiResponse({ status: 200, description: 'API settings updated successfully' })
  async updateApi(@Req() req: any, @Body() dto: ApiSettingsDto) {
    await this.tenantsService.updateSettings(req.tenant.id, { api: dto });
    const updated = await this.tenantsService.findOne(req.tenant.id);
    return updated.settings?.api ?? dto;
  }
}