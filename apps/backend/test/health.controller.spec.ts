import { HealthController } from '../src/modules/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const mockDatabaseService = {
    testConnection: jest.fn().mockResolvedValue(true),
  } as any;

  beforeEach(() => {
    controller = new HealthController(mockDatabaseService);
  });

  it('should return health status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
  });
});
