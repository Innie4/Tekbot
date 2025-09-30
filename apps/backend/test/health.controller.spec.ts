import { HealthController } from '../src/modules/health/health.controller';
import { HealthService } from '../src/modules/analytics/health.service';
import { DatabaseService } from '../src/modules/database/database.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;
  let databaseService: DatabaseService;

  beforeEach(() => {
    databaseService = {} as DatabaseService;
    service = new HealthService(databaseService);
    controller = new HealthController(service);
  });

  it('should return health status', () => {
    const result = controller.getStatus();
    expect(result.status).toBe('ok');
  });
});
