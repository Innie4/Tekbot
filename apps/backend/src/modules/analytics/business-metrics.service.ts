import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Metric } from './entities/metric.entity';

@Injectable()
export class BusinessMetricsService {
  constructor(
    @InjectRepository(Metric)
    private readonly metricRepository: Repository<Metric>,
  ) {}

  async trackBotAccuracy(tenantId: string, accuracy: number) {
    const metric = this.metricRepository.create({
      tenantId,
      type: 'bot_accuracy',
      value: accuracy,
    });
    await this.metricRepository.save(metric);
    return metric;
  }

  async trackConversion(tenantId: string, conversion: number) {
    const metric = this.metricRepository.create({
      tenantId,
      type: 'conversion',
      value: conversion,
    });
    await this.metricRepository.save(metric);
    return metric;
  }

  async trackEngagement(tenantId: string, engagement: number) {
    const metric = this.metricRepository.create({
      tenantId,
      type: 'engagement',
      value: engagement,
    });
    await this.metricRepository.save(metric);
    return metric;
  }
}
