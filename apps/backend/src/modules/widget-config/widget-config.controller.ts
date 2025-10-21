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
  create(
    @Body() createWidgetConfigDto: CreateWidgetConfigDto,
    @Req() req: any,
  ) {
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
  update(
    @Body() updateWidgetConfigDto: UpdateWidgetConfigDto,
    @Req() req: any,
  ) {
    return this.widgetConfigService.update(
      req.tenant.id,
      updateWidgetConfigDto,
    );
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
  getPublicConfig(@Param('tenantId') tenantId: string) {
    return this.widgetConfigService.getPublicConfig(tenantId);
  }

  @Get('embed/:tenantId')
  @Public()
  getEmbedCodePublic(
    @Param('tenantId') tenantId: string,
    @Query('domain') domain?: string,
  ) {
    return this.widgetConfigService.generateEmbedCode(tenantId, domain);
  }
}
