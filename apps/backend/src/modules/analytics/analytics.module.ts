import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Metric } from './entities/metric.entity';
import { BusinessMetricsService } from './business-metrics.service';
import { HealthService } from './health.service';
import { DatabaseModule } from '../database/database.module';
import { SentryService } from './sentry.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Metric]),
    DatabaseModule,
  ],
  providers: [BusinessMetricsService, HealthService, SentryService],
  exports: [BusinessMetricsService, HealthService, SentryService],
})
export class AnalyticsModule {}