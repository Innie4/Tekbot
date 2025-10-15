import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { SentryService } from '../../modules/analytics/sentry.service';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  details?: any;
  stack?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  constructor(private readonly sentry?: SentryService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { user?: any; tenant?: any; requestId?: string }>();
    
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    
    // Extract error details
    const errorDetails = this.extractErrorDetails(exceptionResponse);
    
    // Build error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: errorDetails.message,
      error: errorDetails.error || exception.name,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.requestId,
      tenantId: request.tenant?.id,
      userId: request.user?.id,
    };

    // Add additional details for specific error types
    if (exception instanceof ThrottlerException) {
      errorResponse.details = {
        retryAfter: this.getRetryAfter(request),
        limit: this.getRateLimit(request),
      };
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = exception.stack;
    }

    // Log error
    this.logError(exception, request, errorResponse);

    // Capture with Sentry for server errors and throttling
    try {
      if (this.sentry && (status >= 500 || exception instanceof ThrottlerException)) {
        this.sentry.captureException(exception);
      }
    } catch {}

    // Send response
    response.status(status).json(errorResponse);
  }

  private extractErrorDetails(exceptionResponse: any): { message: string | string[]; error?: string } {
    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    if (typeof exceptionResponse === 'object') {
      return {
        message: exceptionResponse.message || 'An error occurred',
        error: exceptionResponse.error,
      };
    }

    return { message: 'An error occurred' };
  }

  private logError(exception: HttpException, request: Request, errorResponse: ErrorResponse): void {
    const { statusCode, message, path, requestId, tenantId, userId } = errorResponse;
    
    const logContext = {
      statusCode,
      message,
      path,
      requestId,
      tenantId,
      userId,
      method: request.method,
      userAgent: request.get('user-agent'),
      ip: this.getClientIp(request),
      body: this.sanitizeBody(request.body),
      query: request.query,
      params: request.params,
      headers: this.sanitizeHeaders(request.headers),
      exception: {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      },
    };

    // Log based on status code
    if (statusCode >= 500) {
      this.logger.error(`Server Error: ${message}`, logContext);
    } else if (statusCode >= 400) {
      this.logger.warn(`Client Error: ${message}`, logContext);
    } else {
      this.logger.log(`HTTP Exception: ${message}`, logContext);
    }
  }

  private getClientIp(request: Request): string {
    return (
      request.get('x-forwarded-for')?.split(',')[0] ||
      request.get('x-real-ip') ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }

  private sanitizeHeaders(headers: any): any {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'confirmPassword',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'accessToken',
      'apiKey',
      'secret',
    ];

    const sanitized = { ...body };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private getRetryAfter(request: Request): number {
    // Extract retry-after from rate limiting headers if available
    const retryAfter = request.get('retry-after');
    return retryAfter ? parseInt(retryAfter) : 60;
  }

  private getRateLimit(request: Request): number {
    // Extract rate limit from headers if available
    const rateLimit = request.get('x-ratelimit-limit');
    return rateLimit ? parseInt(rateLimit) : 100;
  }
}