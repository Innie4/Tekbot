import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin as string;
    const allowedOrigins = this.getAllowedOrigins();

    // Check if origin is allowed
    if (this.isOriginAllowed(origin, allowedOrigins)) {
      res.header('Access-Control-Allow-Origin', origin);
    }

    // Set other CORS headers
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Tenant-ID, X-Session-ID, X-Customer-ID',
    );
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    );
    res.header('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  }

  private getAllowedOrigins(): string[] {
    const baseOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://tekassist.com',
      'https://www.tekassist.com',
      'https://app.tekassist.com',
      'https://cdn.tekassist.com',
    ];

    // Add environment-specific origins
    const envOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    return [...baseOrigins, ...envOrigins];
  }

  private isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    if (!origin) return false;

    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return true;
    }

    // Check wildcard patterns
    return allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return false;
    });
  }
}

// Enhanced CORS configuration for specific routes
export interface CorsOptions {
  origins?: string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

@Injectable()
export class WidgetCorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin as string;

    // More permissive CORS for widget endpoints
    const allowedOrigins = this.getWidgetAllowedOrigins();

    if (this.isOriginAllowed(origin, allowedOrigins)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      // For widget endpoints, we might want to be more permissive
      // but still secure. Check if it's a valid domain pattern.
      if (this.isValidWidgetOrigin(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    }

    res.header('Access-Control-Allow-Credentials', 'true');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, X-Tenant-ID, X-Session-ID, X-Customer-ID, X-Widget-Version',
    );
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Max-Age', '3600'); // 1 hour for widget requests

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  }

  private getWidgetAllowedOrigins(): string[] {
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://tekassist.com',
      'https://*.tekassist.com',
      'https://cdn.tekassist.com',
      // Add more patterns as needed
    ];
  }

  private isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    if (!origin) return false;

    return allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '[^.]*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      return allowed === origin;
    });
  }

  private isValidWidgetOrigin(origin: string): boolean {
    if (!origin) return false;

    try {
      const url = new URL(origin);

      // Basic security checks
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return false;
      }

      // Block obviously malicious patterns
      const hostname = url.hostname.toLowerCase();
      const blockedPatterns = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        'example.com',
        'test.com',
      ];

      // Allow localhost for development
      if (process.env.NODE_ENV === 'development') {
        return true;
      }

      // In production, be more restrictive
      return !blockedPatterns.some(pattern => hostname.includes(pattern));
    } catch {
      return false;
    }
  }
}

// Utility function to create CORS configuration
export function createCorsConfig(options: CorsOptions = {}): any {
  return {
    origin: (
      origin: string,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowedOrigins = options.origins || [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://tekassist.com',
        'https://www.tekassist.com',
        'https://app.tekassist.com',
      ];

      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: options.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: options.headers || [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Tenant-ID',
      'X-Session-ID',
      'X-Customer-ID',
    ],
    credentials: options.credentials !== false,
    maxAge: options.maxAge || 86400,
  };
}
