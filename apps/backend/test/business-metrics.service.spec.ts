
import { BusinessMetricsService } from '../src/modules/analytics/business-metrics.service';
import { Metric } from '../src/modules/analytics/entities/metric.entity';
import { Repository } from 'typeorm';

function createMockRepository(): Partial<Repository<Metric>> {
  return {
    create: jest.fn(),
    save: jest.fn(),
  };
}

describe('BusinessMetricsService', () => {

  let service: BusinessMetricsService;
  let metricRepository: Partial<Repository<Metric>>;

  beforeEach(() => {
    metricRepository = createMockRepository();
    service = new BusinessMetricsService(metricRepository as Repository<Metric>);
  });


  it('should track bot accuracy', async () => {
    (metricRepository.create as jest.Mock).mockReturnValue({ tenantId: 'tenant1', type: 'bot_accuracy', value: 0.95 });
    (metricRepository.save as jest.Mock).mockResolvedValue({ tenantId: 'tenant1', type: 'bot_accuracy', value: 0.95 });
    const result = await service.trackBotAccuracy('tenant1', 0.95);
    expect(result).toMatchObject({ tenantId: 'tenant1', type: 'bot_accuracy', value: 0.95 });
  });


  it('should track conversion', async () => {
    (metricRepository.create as jest.Mock).mockReturnValue({ tenantId: 'tenant1', type: 'conversion', value: 0.5 });
    (metricRepository.save as jest.Mock).mockResolvedValue({ tenantId: 'tenant1', type: 'conversion', value: 0.5 });
    const result = await service.trackConversion('tenant1', 0.5);
    expect(result).toMatchObject({ tenantId: 'tenant1', type: 'conversion', value: 0.5 });
  });


  it('should track engagement', async () => {
    (metricRepository.create as jest.Mock).mockReturnValue({ tenantId: 'tenant1', type: 'engagement', value: 0.8 });
    (metricRepository.save as jest.Mock).mockResolvedValue({ tenantId: 'tenant1', type: 'engagement', value: 0.8 });
    const result = await service.trackEngagement('tenant1', 0.8);
    expect(result).toMatchObject({ tenantId: 'tenant1', type: 'engagement', value: 0.8 });
  });
});
