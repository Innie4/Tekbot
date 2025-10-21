import { RoleGuard } from '../src/common/security/role.guard';
import { Reflector } from '@nestjs/core';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RoleGuard(reflector);
  });

  it('should allow access if no roles required', () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: ['admin'] } }),
      }),
      getHandler: () => ({}),
    };
    jest.spyOn(reflector, 'get').mockReturnValue(undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: ['admin'] } }),
      }),
      getHandler: () => ({}),
    };
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access if user lacks required role', () => {
    const context: any = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: ['user'] } }),
      }),
      getHandler: () => ({}),
    };
    jest.spyOn(reflector, 'get').mockReturnValue(['admin']);
    expect(guard.canActivate(context)).toBe(false);
  });
});
