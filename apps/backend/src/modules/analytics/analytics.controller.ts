import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { BusinessMetricsService } from './business-metrics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenants/guards/tenant.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AnalyticsController {
  constructor(private readonly metricsService: BusinessMetricsService) {}

  @Get('dashboard')
  async getDashboardMetrics(@Query('tenantId') tenantId?: string) {
    return {
      totalConversations: {
        value: '12,543',
        change: '+18.2%',
        trend: 'up'
      },
      avgResponseTime: {
        value: '1.2s',
        change: '-0.3s',
        trend: 'up'
      },
      userSatisfaction: {
        value: '94%',
        change: '+2.4%',
        trend: 'up'
      },
      failedResponses: {
        value: '2.1%',
        change: '+0.5%',
        trend: 'down'
      },
      conversationVolume: this.generateConversationVolumeData(),
      responseTimeData: this.generateResponseTimeData()
    };
  }

  @Get('bot-accuracy/:tenantId')
  getBotAccuracy(@Param('tenantId') tenantId: string) {
    return this.metricsService.trackBotAccuracy(tenantId, Math.random());
  }

  @Get('conversion/:tenantId')
  getConversion(@Param('tenantId') tenantId: string) {
    return this.metricsService.trackConversion(tenantId, Math.random());
  }

  @Get('engagement/:tenantId')
  getEngagement(@Param('tenantId') tenantId: string) {
    return this.metricsService.trackEngagement(tenantId, Math.random());
  }

  private generateConversationVolumeData() {
    const data = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        conversations: Math.floor(Math.random() * 500) + 100
      });
    }
    return data;
  }

  private generateResponseTimeData() {
    const data = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const date = new Date(now);
      date.setHours(date.getHours() - i);
      data.push({
        hour: date.getHours(),
        responseTime: Math.random() * 2 + 0.5
      });
    }
    return data;
  }
}
