import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface LogContext {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  tenantId?: string;
  startTime: number;
  statusCode?: number;
  responseTime?: number;
  contentLength?: number;
  error?: any;
}

// Extend Request interface to include logging context
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
      logContext?: LogContext;
    }
  }
}

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  private readonly excludedPaths = ['/health', '/metrics', '/favicon.ico'];

  private readonly sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
  ];

  private readonly sensitiveBodyFields = [
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

  use(req: Request, res: Response, next: NextFunction) {
    // Skip logging for excluded paths
    if (this.shouldSkipLogging(req.path)) {
      return next();
    }

    // Generate request ID and start time
    const requestId = uuidv4();
    const startTime = Date.now();

    // Attach to request for use in other parts of the application
    req.requestId = requestId;
    req.startTime = startTime;

    // Create log context
    const logContext: LogContext = {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
      ip: this.getClientIp(req),
      startTime,
    };

    req.logContext = logContext;

    // Log incoming request
    this.logIncomingRequest(req, logContext);

    // Capture response details
    const originalSend = res.send;
    const originalJson = res.json;
    let responseBody: any;

    // Override res.send to capture response body
    res.send = function (body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    // Override res.json to capture response body
    res.json = function (body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    };

    // Log response when finished
    res.on('finish', () => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      logContext.statusCode = res.statusCode;
      logContext.responseTime = responseTime;
      logContext.contentLength = res.get('content-length')
        ? parseInt(res.get('content-length')!)
        : undefined;

      this.logOutgoingResponse(req, res, logContext, responseBody);
    });

    // Handle errors
    res.on('error', error => {
      logContext.error = error;
      this.logError(req, logContext, error);
    });

    next();
  }

  private shouldSkipLogging(path: string): boolean {
    return this.excludedPaths.some(excludedPath =>
      path.startsWith(excludedPath),
    );
  }

  private getClientIp(req: Request): string {
    return (
      req.get('x-forwarded-for')?.split(',')[0] ||
      req.get('x-real-ip') ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  private logIncomingRequest(req: Request, context: LogContext): void {
    const { requestId, method, url, userAgent, ip } = context;

    // Extract user and tenant info if available
    const userId = (req as any).user?.id;
    const tenantId = (req as any).tenant?.id || req.tenantId;

    if (userId) context.userId = userId;
    if (tenantId) context.tenantId = tenantId;

    const logData = {
      requestId,
      method,
      url,
      userAgent,
      ip,
      userId,
      tenantId,
      headers: this.sanitizeHeaders(req.headers),
      query: req.query,
      body: this.sanitizeBody(req.body),
      timestamp: new Date().toISOString(),
    };

    this.logger.log(`Incoming ${method} ${url}`, logData);
  }

  private logOutgoingResponse(
    req: Request,
    res: Response,
    context: LogContext,
    responseBody: any,
  ): void {
    const { requestId, method, url, statusCode, responseTime, contentLength } =
      context;

    const logLevel = this.getLogLevel(statusCode!);
    const logData = {
      requestId,
      method,
      url,
      statusCode,
      responseTime,
      contentLength,
      userId: context.userId,
      tenantId: context.tenantId,
      responseBody: this.sanitizeResponseBody(responseBody, statusCode!),
      timestamp: new Date().toISOString(),
    };

    const message = `${method} ${url} ${statusCode} - ${responseTime}ms`;

    if (logLevel === 'error') {
      this.logger.error(message, logData);
    } else if (logLevel === 'warn') {
      this.logger.warn(message, logData);
    } else {
      this.logger.log(message, logData);
    }
  }

  private logError(req: Request, context: LogContext, error: any): void {
    const { requestId, method, url } = context;

    const logData = {
      requestId,
      method,
      url,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      userId: context.userId,
      tenantId: context.tenantId,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(`Error in ${method} ${url}`, logData);
  }

  private getLogLevel(statusCode: number): 'log' | 'warn' | 'error' {
    if (statusCode >= 500) return 'error';
    if (statusCode >= 400) return 'warn';
    return 'log';
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    this.sensitiveHeaders.forEach(header => {
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

    const sanitized = { ...body };

    this.sensitiveBodyFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeResponseBody(body: any, statusCode: number): any {
    // Don't log response body for successful requests to reduce log size
    if (statusCode >= 200 && statusCode < 300) {
      return '[SUCCESS_RESPONSE_BODY_OMITTED]';
    }

    // Log error responses for debugging
    if (statusCode >= 400) {
      return body;
    }

    return '[RESPONSE_BODY_OMITTED]';
  }
}
