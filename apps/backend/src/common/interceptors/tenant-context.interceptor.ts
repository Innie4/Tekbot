import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  async setTenantContext(tenantId: string) {
    // Set the tenant context for RLS enforcement
    await this.dataSource.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request?.tenant?.id;
    if (tenantId) {
      await this.setTenantContext(tenantId);
    }
    return next.handle();
  }
}
