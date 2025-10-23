import { HealthController } from '../src/modules/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('should return health status', () => {
    const result = controller.check();
    expect(result.status).toBe('ok');
  });
});
