import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  SetMetadata,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly defaultTimeout = 30000; // 30 seconds

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Get custom timeout from metadata
    const customTimeout = this.reflector.getAllAndOverride<number>('timeout', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Determine timeout based on request type
    const timeoutValue = customTimeout || this.getTimeoutForRequest(request);

    return next.handle().pipe(
      timeout(timeoutValue),
      catchError((error) => {
        if (error instanceof TimeoutError) {
          const timeoutMessage = this.getTimeoutMessage(request, timeoutValue);
          return throwError(() => new RequestTimeoutException(timeoutMessage));
        }
        return throwError(() => error);
      })
    );
  }

  private getTimeoutForRequest(request: Request): number {
    const method = request.method.toUpperCase();
    const path = request.path;

    // Different timeouts for different types of operations
    
    // File upload/download operations - longer timeout
    if (this.isFileOperation(path)) {
      return 300000; // 5 minutes
    }

    // Report generation - longer timeout
    if (this.isReportOperation(path)) {
      return 120000; // 2 minutes
    }

    // Bulk operations - longer timeout
    if (this.isBulkOperation(path)) {
      return 180000; // 3 minutes
    }

    // AI/ML operations - longer timeout
    if (this.isAIOperation(path)) {
      return 60000; // 1 minute
    }

    // Payment operations - moderate timeout
    if (this.isPaymentOperation(path)) {
      return 45000; // 45 seconds
    }

    // Email operations - moderate timeout
    if (this.isEmailOperation(path)) {
      return 30000; // 30 seconds
    }

    // Database-heavy operations
    if (this.isDatabaseHeavyOperation(method, path)) {
      return 45000; // 45 seconds
    }

    // Quick operations - shorter timeout
    if (this.isQuickOperation(method, path)) {
      return 10000; // 10 seconds
    }

    // Default timeout
    return this.defaultTimeout;
  }

  private isFileOperation(path: string): boolean {
    const filePatterns = [
      '/upload',
      '/download',
      '/files',
      '/attachments',
      '/media',
      '/documents',
      '/export',
      '/import',
    ];
    
    return filePatterns.some(pattern => path.includes(pattern));
  }

  private isReportOperation(path: string): boolean {
    const reportPatterns = [
      '/reports',
      '/analytics',
      '/dashboard',
      '/statistics',
      '/metrics',
    ];
    
    return reportPatterns.some(pattern => path.includes(pattern));
  }

  private isBulkOperation(path: string): boolean {
    const bulkPatterns = [
      '/bulk',
      '/batch',
      '/mass',
      '/multiple',
    ];
    
    return bulkPatterns.some(pattern => path.includes(pattern));
  }

  private isAIOperation(path: string): boolean {
    const aiPatterns = [
      '/ai',
      '/chat',
      '/generate',
      '/analyze',
      '/process',
      '/openai',
      '/completion',
      '/embedding',
    ];
    
    return aiPatterns.some(pattern => path.includes(pattern));
  }

  private isPaymentOperation(path: string): boolean {
    const paymentPatterns = [
      '/payments',
      '/billing',
      '/subscriptions',
      '/checkout',
      '/stripe',
      '/paystack',
      '/transactions',
    ];
    
    return paymentPatterns.some(pattern => path.includes(pattern));
  }

  private isEmailOperation(path: string): boolean {
    const emailPatterns = [
      '/email',
      '/mail',
      '/notifications',
      '/send',
    ];
    
    return emailPatterns.some(pattern => path.includes(pattern));
  }

  private isDatabaseHeavyOperation(method: string, path: string): boolean {
    // Complex queries or operations that might take longer
    const heavyPatterns = [
      '/search',
      '/filter',
      '/aggregate',
      '/complex',
      '/join',
    ];
    
    // POST/PUT/PATCH operations with complex data
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      return heavyPatterns.some(pattern => path.includes(pattern));
    }

    return false;
  }

  private isQuickOperation(method: string, path: string): boolean {
    // Simple GET operations for basic data
    if (method === 'GET') {
      const quickPatterns = [
        '/health',
        '/status',
        '/ping',
        '/version',
        '/info',
      ];
      
      return quickPatterns.some(pattern => path.includes(pattern));
    }

    return false;
  }

  private getTimeoutMessage(request: Request, timeoutValue: number): string {
    const method = request.method;
    const path = request.path;
    const timeoutSeconds = Math.round(timeoutValue / 1000);
    
    return `Request ${method} ${path} timed out after ${timeoutSeconds} seconds. ` +
           'Please try again or contact support if the issue persists.';
  }
}

// Decorator to set custom timeout
export const Timeout = (milliseconds: number) => SetMetadata('timeout', milliseconds);