import { HealthService } from '../src/modules/analytics/health.service';
import { DatabaseService } from '../src/modules/database/database.service';

describe('HealthService', () => {
  let service: HealthService;
  let databaseService: DatabaseService;

  beforeEach(() => {
    databaseService = {} as DatabaseService;
    service = new HealthService(databaseService);
  });

  it('should return status ok', () => {
    const result = service.getStatus();
    expect(result.status).toBe('ok');
    expect(typeof result.uptime).toBe('number');
  });
});
