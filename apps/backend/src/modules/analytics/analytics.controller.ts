import { Controller, Get, Param } from '@nestjs/common';
import { BusinessMetricsService } from './business-metrics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly metricsService: BusinessMetricsService) {}

  @Get('bot-accuracy/:tenantId')
  getBotAccuracy(@Param('tenantId') tenantId: string) {
    // TODO: Fetch bot accuracy metric
    return this.metricsService.trackBotAccuracy(tenantId, Math.random());
  }

  @Get('conversion/:tenantId')
  getConversion(@Param('tenantId') tenantId: string) {
    // TODO: Fetch conversion metric
    return this.metricsService.trackConversion(tenantId, Math.random());
  }

  @Get('engagement/:tenantId')
  getEngagement(@Param('tenantId') tenantId: string) {
    // TODO: Fetch engagement metric
    return this.metricsService.trackEngagement(tenantId, Math.random());
  }
}
