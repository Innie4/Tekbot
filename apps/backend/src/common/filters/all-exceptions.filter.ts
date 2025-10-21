import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from 'jsonwebtoken';
import { SentryService } from '../../modules/analytics/sentry.service';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  details?: any;
  stack?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  constructor(private readonly sentry?: SentryService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<
      Request & { user?: any; tenant?: any; requestId?: string }
    >();

    let status: number;
    let message: string;
    let error: string;
    let details: any = undefined;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
        details = (exceptionResponse as any).details;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof QueryFailedError) {
      // Database errors
      status = HttpStatus.BAD_REQUEST;
      message = this.handleDatabaseError(exception);
      error = 'Database Error';
      details = {
        query: exception.query,
        parameters: exception.parameters,
      };
    } else if (exception instanceof TokenExpiredError) {
      // JWT token expired
      status = HttpStatus.UNAUTHORIZED;
      message = 'Token has expired';
      error = 'Token Expired';
    } else if (exception instanceof JsonWebTokenError) {
      // JWT token invalid
      status = HttpStatus.UNAUTHORIZED;
      message = 'Invalid token';
      error = 'Invalid Token';
    } else if (exception instanceof NotBeforeError) {
      // JWT token not active yet
      status = HttpStatus.UNAUTHORIZED;
      message = 'Token not active';
      error = 'Token Not Active';
    } else if (exception instanceof Error) {
      // Generic errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = this.getGenericErrorMessage(exception);
      error = exception.name || 'Internal Server Error';
    } else {
      // Unknown errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      error = 'Unknown Error';
    }

    // Build error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: request.requestId,
      tenantId: request.tenant?.id,
      userId: request.user?.id,
    };

    // Add details if available
    if (details) {
      errorResponse.details = details;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    // Log error
    this.logError(exception, request, errorResponse);

    // Capture with Sentry for server errors
    try {
      if (this.sentry && status >= 500) {
        this.sentry.captureException(exception);
      }
    } catch {}

    // Send response
    response.status(status).json(errorResponse);
  }

  private handleDatabaseError(error: QueryFailedError): string {
    const message = error.message.toLowerCase();

    // Handle common database constraint violations
    if (
      message.includes('unique constraint') ||
      message.includes('duplicate')
    ) {
      return 'A record with this information already exists';
    }

    if (message.includes('foreign key constraint')) {
      return 'Referenced record does not exist';
    }

    if (message.includes('not null constraint')) {
      return 'Required field is missing';
    }

    if (message.includes('check constraint')) {
      return 'Invalid data provided';
    }

    if (message.includes('connection')) {
      return 'Database connection error';
    }

    if (message.includes('timeout')) {
      return 'Database operation timed out';
    }

    // Return generic message for other database errors
    return 'Database operation failed';
  }

  private getGenericErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    // Handle common Node.js errors
    if (message.includes('enotfound') || message.includes('dns')) {
      return 'Network connection error';
    }

    if (message.includes('econnrefused')) {
      return 'Connection refused';
    }

    if (message.includes('timeout')) {
      return 'Operation timed out';
    }

    if (message.includes('permission denied') || message.includes('eacces')) {
      return 'Permission denied';
    }

    if (message.includes('file not found') || message.includes('enoent')) {
      return 'Resource not found';
    }

    if (message.includes('out of memory')) {
      return 'Insufficient memory';
    }

    // Return original message for development, generic for production
    if (process.env.NODE_ENV === 'development') {
      return error.message;
    }

    return 'An internal server error occurred';
  }

  private logError(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ): void {
    const { statusCode, message, path, requestId, tenantId, userId } =
      errorResponse;

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
        name: exception instanceof Error ? exception.name : 'Unknown',
        message:
          exception instanceof Error ? exception.message : 'Unknown error',
        stack: exception instanceof Error ? exception.stack : undefined,
      },
    };

    // Log based on status code
    if (statusCode >= 500) {
      this.logger.error(`Server Error: ${message}`, logContext);
    } else if (statusCode >= 400) {
      this.logger.warn(`Client Error: ${message}`, logContext);
    } else {
      this.logger.log(`Exception: ${message}`, logContext);
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
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];
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
      'creditCard',
      'ssn',
    ];

    const sanitized = { ...body };

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
