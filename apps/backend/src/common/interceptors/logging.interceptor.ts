import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<
      Request & {
        user?: any;
        tenant?: any;
        requestId?: string;
        startTime?: number;
      }
    >();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;

    const startTime = request.startTime || Date.now();
    const requestId = request.requestId;
    const userId = request.user?.id;
    const tenantId = request.tenant?.id;

    // Log request start
    this.logger.log(`${method} ${url} - Started`, {
      requestId,
      method,
      url,
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap(data => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const statusCode = response.statusCode;

        // Log successful response
        this.logger.log(`${method} ${url} ${statusCode} - ${duration}ms`, {
          requestId,
          method,
          url,
          statusCode,
          duration,
          userId,
          tenantId,
          responseSize: this.getResponseSize(data),
          timestamp: new Date().toISOString(),
        });
      }),
      catchError(error => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const statusCode = error.status || 500;

        // Log error response
        this.logger.error(
          `${method} ${url} ${statusCode} - ${duration}ms - ERROR`,
          {
            requestId,
            method,
            url,
            statusCode,
            duration,
            userId,
            tenantId,
            error: {
              name: error.name,
              message: error.message,
              stack:
                process.env.NODE_ENV === 'development'
                  ? error.stack
                  : undefined,
            },
            timestamp: new Date().toISOString(),
          },
        );

        throw error;
      }),
    );
  }

  private getResponseSize(data: any): number {
    if (!data) return 0;

    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }
}
