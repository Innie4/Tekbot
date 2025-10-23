import { GdprService } from '../src/common/security/gdpr.service';

import { Repository } from 'typeorm';

describe('GdprService', () => {
  let service: GdprService;
  let userRepository: Partial<Repository<any>>;
  let consentRepository: Partial<Repository<any>>;

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        password: 'secret',
      }),
      delete: jest.fn().mockResolvedValue({}),
    };
    consentRepository = {
      create: jest.fn().mockImplementation(data => data),
      save: jest.fn().mockResolvedValue({ userId: 'user1', consent: true }),
    };
    service = new GdprService(
      userRepository as Repository<any>,
      consentRepository as Repository<any>,
    );
  });

  it('should export data', async () => {
    const result = await service.exportData('user1');
    expect(result).toMatchObject({ id: 'user1', name: 'Test User' });
    expect(result).not.toHaveProperty('password');
  });

  it('should delete data', async () => {
    const result = await service.deleteData('user1');
    expect(result).toMatchObject({ userId: 'user1', deleted: true });
  });

  it('should record consent', async () => {
    const result = await service.recordConsent('user1', true);
    expect(result).toMatchObject({ userId: 'user1', consent: true });
  });
});
