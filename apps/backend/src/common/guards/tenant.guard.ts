import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: any; tenant?: any }>();
    const user = request.user;

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // If no user is attached, let the auth guard handle it
    if (!user) {
      return true;
    }

    // Extract tenant information from request
    const tenantInfo = this.extractTenantInfo(request);
    
    if (!tenantInfo) {
      throw new BadRequestException('Tenant information is required');
    }

    // Validate tenant access
    this.validateTenantAccess(user, tenantInfo);

    // Attach tenant info to request for use in controllers
    request.tenant = tenantInfo;

    return true;
  }

  private extractTenantInfo(request: Request): any {
    // Try to get tenant from subdomain
    const host = request.get('host');
    if (host) {
      const subdomain = this.extractSubdomain(host);
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        return {
          type: 'subdomain',
          identifier: subdomain,
          slug: subdomain,
        };
      }
    }

    // Try to get tenant from custom domain
    const customDomain = request.get('x-tenant-domain');
    if (customDomain) {
      return {
        type: 'domain',
        identifier: customDomain,
        domain: customDomain,
      };
    }

    // Try to get tenant from header
    const tenantHeader = request.get('x-tenant-id') || request.get('x-tenant-slug');
    if (tenantHeader) {
      return {
        type: 'header',
        identifier: tenantHeader,
        id: request.get('x-tenant-id'),
        slug: request.get('x-tenant-slug'),
      };
    }

    // Try to get tenant from path parameter
    const tenantParam = request.params?.tenantId || request.params?.tenantSlug;
    if (tenantParam) {
      return {
        type: 'param',
        identifier: tenantParam,
        id: request.params?.tenantId,
        slug: request.params?.tenantSlug,
      };
    }

    // Try to get tenant from query parameter
    const tenantQuery = request.query?.tenantId || request.query?.tenantSlug;
    if (tenantQuery) {
      return {
        type: 'query',
        identifier: tenantQuery,
        id: request.query?.tenantId,
        slug: request.query?.tenantSlug,
      };
    }

    return null;
  }

  private extractSubdomain(host: string): string | null {
    const parts = host.split('.');
    
    // For localhost development
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return null;
    }

    // For production domains (e.g., tenant.example.com)
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }

  private validateTenantAccess(user: any, tenantInfo: any): void {
    // Super admin can access any tenant
    if (user.roles?.includes('super_admin')) {
      return;
    }

    // Check if user belongs to the tenant
    const userTenants = user.tenants || [];
    const userTenantIds = userTenants.map((t: any) => t.id || t.tenantId);
    const userTenantSlugs = userTenants.map((t: any) => t.slug || t.tenantSlug);
    const userTenantDomains = userTenants.map((t: any) => t.domain || t.customDomain);

    let hasAccess = false;

    // Check access based on tenant identifier type
    switch (tenantInfo.type) {
      case 'subdomain':
        hasAccess = userTenantSlugs.includes(tenantInfo.slug);
        break;
      case 'domain':
        hasAccess = userTenantDomains.includes(tenantInfo.domain);
        break;
      case 'header':
      case 'param':
      case 'query':
        if (tenantInfo.id) {
          hasAccess = userTenantIds.includes(tenantInfo.id);
        } else if (tenantInfo.slug) {
          hasAccess = userTenantSlugs.includes(tenantInfo.slug);
        }
        break;
    }

    if (!hasAccess) {
      throw new ForbiddenException(
        `Access denied: You do not have access to tenant '${tenantInfo.identifier}'`
      );
    }

    // Check if user's tenant membership is active
    const userTenant = userTenants.find((t: any) => 
      t.id === tenantInfo.id || 
      t.slug === tenantInfo.slug || 
      t.domain === tenantInfo.domain
    );

    if (userTenant && userTenant.status !== 'active') {
      throw new ForbiddenException(
        `Access denied: Your membership to tenant '${tenantInfo.identifier}' is not active`
      );
    }

    // Check if tenant is active
    if (userTenant && userTenant.tenantStatus !== 'active') {
      throw new ForbiddenException(
        `Access denied: Tenant '${tenantInfo.identifier}' is not active`
      );
    }
  }
}