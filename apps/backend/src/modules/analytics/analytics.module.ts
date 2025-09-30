import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Metric } from './entities/metric.entity';
import { BusinessMetricsService } from './business-metrics.service';
import { HealthService } from './health.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Metric]),
    DatabaseModule,
  ],
  providers: [BusinessMetricsService, HealthService],
  exports: [BusinessMetricsService, HealthService],
})
export class AnalyticsModule {}