import { AnalyticsController } from '../src/modules/analytics/analytics.controller';
import { BusinessMetricsService } from '../src/modules/analytics/business-metrics.service';
import { Repository } from 'typeorm';

function createMockRepository() {
  return {
    create: jest.fn().mockImplementation(data => data),
    save: jest.fn().mockImplementation(data => Promise.resolve(data)),
  };
}

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let service: BusinessMetricsService;
  let metricRepository: any;

  beforeEach(() => {
    metricRepository = createMockRepository();
    service = new BusinessMetricsService(metricRepository as Repository<any>);
    controller = new AnalyticsController(service);
  });

  it('should get bot accuracy', async () => {
    const result = await controller.getBotAccuracy('tenant1');
    expect(result).toMatchObject({ tenantId: 'tenant1', type: 'bot_accuracy' });
  });

  it('should get conversion', async () => {
    const result = await controller.getConversion('tenant1');
    expect(result).toMatchObject({ tenantId: 'tenant1', type: 'conversion' });
  });

  it('should get engagement', async () => {
    const result = await controller.getEngagement('tenant1');
    expect(result).toMatchObject({ tenantId: 'tenant1', type: 'engagement' });
  });
});
