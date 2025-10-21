import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface CorsOptions {
  origin?:
    | string
    | string[]
    | boolean
    | ((
        origin: string,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => void);
  methods?: string | string[];
  allowedHeaders?: string | string[];
  exposedHeaders?: string | string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly defaultOptions: CorsOptions = {
    origin: this.originHandler.bind(this),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Tenant-ID',
      'X-Tenant-Slug',
      'X-Tenant-Domain',
      'X-Request-ID',
      'X-Client-Version',
      'X-Platform',
    ],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-Current-Page',
      'X-Per-Page',
      'X-Rate-Limit-Limit',
      'X-Rate-Limit-Remaining',
      'X-Rate-Limit-Reset',
      'X-Request-ID',
      'X-Tenant-ID',
      'X-Tenant-Slug',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 204,
  };

  private readonly allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://localhost:3000',
    'https://localhost:3001',
    'https://localhost:5173',
    'https://localhost:5174',
  ];

  private readonly productionDomains = [
    'tekassist.com',
    'app.tekassist.com',
    'api.tekassist.com',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.get('origin');
    const method = req.method;

    // Handle preflight requests
    if (method === 'OPTIONS') {
      this.handlePreflightRequest(req, res, origin);
      return;
    }

    // Handle actual requests
    this.handleActualRequest(req, res, origin);
    next();
  }

  private handlePreflightRequest(
    req: Request,
    res: Response,
    origin?: string,
  ): void {
    // Set origin
    if (this.isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin!);
    }

    // Set credentials
    if (this.defaultOptions.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Set allowed methods
    const methods = Array.isArray(this.defaultOptions.methods)
      ? this.defaultOptions.methods.join(', ')
      : this.defaultOptions.methods || 'GET,HEAD,PUT,PATCH,POST,DELETE';
    res.setHeader('Access-Control-Allow-Methods', methods);

    // Set allowed headers
    const requestedHeaders = req.get('access-control-request-headers');
    if (requestedHeaders) {
      // Allow requested headers if they're in our allowed list
      const allowedHeaders = Array.isArray(this.defaultOptions.allowedHeaders)
        ? this.defaultOptions.allowedHeaders
        : this.defaultOptions.allowedHeaders?.split(', ') || [];

      const requestedHeadersList = requestedHeaders.split(', ');
      const validHeaders = requestedHeadersList.filter(header =>
        allowedHeaders.some(
          allowed => allowed.toLowerCase() === header.toLowerCase(),
        ),
      );

      if (validHeaders.length > 0) {
        res.setHeader('Access-Control-Allow-Headers', validHeaders.join(', '));
      }
    } else if (this.defaultOptions.allowedHeaders) {
      const headers = Array.isArray(this.defaultOptions.allowedHeaders)
        ? this.defaultOptions.allowedHeaders.join(', ')
        : this.defaultOptions.allowedHeaders;
      res.setHeader('Access-Control-Allow-Headers', headers);
    }

    // Set max age
    if (this.defaultOptions.maxAge) {
      res.setHeader(
        'Access-Control-Max-Age',
        this.defaultOptions.maxAge.toString(),
      );
    }

    // Send response
    res.status(this.defaultOptions.optionsSuccessStatus || 204).end();
  }

  private handleActualRequest(
    req: Request,
    res: Response,
    origin?: string,
  ): void {
    // Set origin
    if (this.isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin!);
    }

    // Set credentials
    if (this.defaultOptions.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Set exposed headers
    if (this.defaultOptions.exposedHeaders) {
      const headers = Array.isArray(this.defaultOptions.exposedHeaders)
        ? this.defaultOptions.exposedHeaders.join(', ')
        : this.defaultOptions.exposedHeaders;
      res.setHeader('Access-Control-Expose-Headers', headers);
    }

    // Add tenant-specific CORS headers if tenant is available
    this.addTenantSpecificHeaders(req, res);
  }

  private originHandler(
    origin: string,
    callback: (err: Error | null, allow?: boolean) => void,
  ): void {
    const isAllowed = this.isOriginAllowed(origin);
    callback(null, isAllowed);
  }

  private isOriginAllowed(origin?: string): boolean {
    if (!origin) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      return true;
    }

    // Check against allowed origins list
    if (this.allowedOrigins.includes(origin)) {
      return true;
    }

    // Check against production domains
    const url = new URL(origin);
    const hostname = url.hostname;

    // Allow subdomains of production domains
    const isProductionDomain = this.productionDomains.some(domain => {
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });

    if (isProductionDomain) {
      return true;
    }

    // Allow tenant-specific domains (in a real app, this would check the database)
    if (this.isTenantDomain(hostname)) {
      return true;
    }

    // Allow localhost with any port for development
    if (process.env.NODE_ENV === 'development') {
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }
    }

    return false;
  }

  private isTenantDomain(hostname: string): boolean {
    // In a real application, this would check against a database of tenant domains
    // For now, we'll use a simple pattern check

    // Allow domains that look like tenant subdomains
    const tenantSubdomainPattern = /^[a-z0-9-]+\.(tekassist\.com|localhost)$/i;
    if (tenantSubdomainPattern.test(hostname)) {
      return true;
    }

    // Allow custom tenant domains (would be stored in database)
    const customDomainPattern = /^[a-z0-9-]+\.[a-z]{2,}$/i;
    if (customDomainPattern.test(hostname)) {
      // In production, verify this domain is registered to a tenant
      return process.env.NODE_ENV === 'development';
    }

    return false;
  }

  private addTenantSpecificHeaders(req: Request, res: Response): void {
    const tenant = (req as any).tenant;

    if (tenant) {
      // Add tenant-specific CORS headers
      res.setHeader('X-Tenant-ID', tenant.id || '');
      res.setHeader('X-Tenant-Slug', tenant.slug || '');

      // If tenant has custom domains, add them to allowed origins
      if (tenant.customDomains && Array.isArray(tenant.customDomains)) {
        const origin = req.get('origin');
        if (origin && tenant.customDomains.includes(new URL(origin).hostname)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
      }
    }
  }
}
