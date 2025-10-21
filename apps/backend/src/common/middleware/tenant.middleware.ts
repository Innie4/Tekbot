import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface TenantInfo {
  id?: string;
  slug?: string;
  domain?: string;
  name?: string;
  status?: string;
  settings?: Record<string, any>;
  type: 'subdomain' | 'domain' | 'header' | 'param' | 'query';
  identifier: string;
}

// Extend Request interface to include tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantInfo;
      tenantId?: string;
      tenantSlug?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly excludedPaths = [
    '/health',
    '/metrics',
    '/api/v1/auth/register',
    '/api/v1/auth/login',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/webhooks',
    '/api/v1/public',
  ];

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Skip tenant resolution for excluded paths
      if (this.shouldSkipTenantResolution(req.path)) {
        return next();
      }

      // Extract tenant information from request
      const tenantInfo = await this.extractTenantInfo(req);

      if (tenantInfo) {
        // Resolve tenant details (in a real app, this would query the database)
        const resolvedTenant = await this.resolveTenant(tenantInfo);

        if (resolvedTenant) {
          // Attach tenant info to request
          req.tenant = resolvedTenant;
          req.tenantId = resolvedTenant.id;
          req.tenantSlug = resolvedTenant.slug;

          // Set tenant context headers for downstream services
          res.setHeader('X-Tenant-ID', resolvedTenant.id || '');
          res.setHeader('X-Tenant-Slug', resolvedTenant.slug || '');

          // Add tenant-specific CORS headers if needed
          this.addTenantCorsHeaders(res, resolvedTenant);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  private shouldSkipTenantResolution(path: string): boolean {
    return this.excludedPaths.some(excludedPath =>
      path.startsWith(excludedPath),
    );
  }

  private async extractTenantInfo(
    req: Request,
  ): Promise<Partial<TenantInfo> | null> {
    // Try to get tenant from subdomain
    const host = req.get('host');
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
    const customDomain = req.get('x-tenant-domain');
    if (customDomain) {
      return {
        type: 'domain',
        identifier: customDomain,
        domain: customDomain,
      };
    }

    // Try to get tenant from header
    const tenantHeader = req.get('x-tenant-id') || req.get('x-tenant-slug');
    if (tenantHeader) {
      return {
        type: 'header',
        identifier: tenantHeader,
        id: req.get('x-tenant-id'),
        slug: req.get('x-tenant-slug'),
      };
    }

    // Try to get tenant from path parameter
    const tenantParam = req.params?.tenantId || req.params?.tenantSlug;
    if (tenantParam) {
      return {
        type: 'param',
        identifier: tenantParam,
        id: req.params?.tenantId,
        slug: req.params?.tenantSlug,
      };
    }

    // Try to get tenant from query parameter
    const tenantQuery = req.query?.tenantId || req.query?.tenantSlug;
    if (tenantQuery) {
      return {
        type: 'query',
        identifier: tenantQuery as string,
        id: req.query?.tenantId as string,
        slug: req.query?.tenantSlug as string,
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

  private async resolveTenant(
    tenantInfo: Partial<TenantInfo>,
  ): Promise<TenantInfo | null> {
    // In a real application, this would query the database
    // For now, we'll return a mock tenant

    try {
      // Mock tenant resolution logic
      const mockTenant: TenantInfo = {
        id: tenantInfo.id || `tenant-${tenantInfo.identifier}`,
        slug: tenantInfo.slug || tenantInfo.identifier,
        domain: tenantInfo.domain,
        name: `Tenant ${tenantInfo.identifier}`,
        status: 'active',
        type: tenantInfo.type!,
        identifier: tenantInfo.identifier!,
        settings: {
          theme: 'default',
          features: ['chat', 'appointments', 'payments'],
          branding: {
            logo: null,
            primaryColor: '#007bff',
            secondaryColor: '#6c757d',
          },
        },
      };

      // Validate tenant status
      if (mockTenant.status !== 'active') {
        throw new BadRequestException(
          `Tenant '${tenantInfo.identifier}' is not active`,
        );
      }

      return mockTenant;
    } catch (error) {
      // Log error in production
      console.error('Failed to resolve tenant:', error);
      return null;
    }
  }

  private addTenantCorsHeaders(res: Response, tenant: TenantInfo): void {
    // Add tenant-specific CORS headers if the tenant has custom domains
    if (tenant.domain) {
      const allowedOrigins = [
        `https://${tenant.domain}`,
        `https://www.${tenant.domain}`,
      ];

      // In a real app, you'd check the origin against allowed origins
      res.setHeader('Access-Control-Allow-Origin', allowedOrigins.join(', '));
    }

    // Add tenant-specific headers
    res.setHeader('X-Tenant-Name', tenant.name || '');
    res.setHeader('X-Tenant-Status', tenant.status || '');
  }
}
