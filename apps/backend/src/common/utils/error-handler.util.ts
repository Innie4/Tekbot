import { Logger, HttpException, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export interface ErrorContext {
  service: string;
  method: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  exponentialBackoff?: boolean;
  retryCondition?: (error: any) => boolean;
}

export class ErrorHandlerUtil {
  private static readonly logger = new Logger(ErrorHandlerUtil.name);

  /**
   * Wrap async operations with comprehensive error handling
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    fallback?: T,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logError(error, context);
      
      if (fallback !== undefined) {
        return fallback;
      }
      
      throw this.transformError(error, context);
    }
  }

  /**
   * Retry async operations with exponential backoff
   */
  static async retryAsync<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    options: RetryOptions,
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry this error
        if (options.retryCondition && !options.retryCondition(error)) {
          break;
        }
        
        // Don't retry on the last attempt
        if (attempt === options.maxAttempts) {
          break;
        }
        
        // Calculate delay
        const delay = options.exponentialBackoff 
          ? options.delay * Math.pow(2, attempt - 1)
          : options.delay;
        
        this.logger.warn(
          `Attempt ${attempt}/${options.maxAttempts} failed for ${context.service}.${context.method}. Retrying in ${delay}ms`,
          { error: error.message, context }
        );
        
        await this.sleep(delay);
      }
    }
    
    this.logError(lastError, { ...context, finalAttempt: true });
    throw this.transformError(lastError, context);
  }

  /**
   * Handle database operations with specific error handling
   */
  static async handleDatabaseOperation<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof QueryFailedError) {
        this.logDatabaseError(error, context);
        throw this.transformDatabaseError(error);
      }
      
      this.logError(error, context);
      throw this.transformError(error, context);
    }
  }

  /**
   * Handle external API calls with timeout and retry
   */
  static async handleExternalApiCall<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    timeout: number = 30000,
    retryOptions?: Partial<RetryOptions>,
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeout);
    });

    const wrappedOperation = async () => {
      return Promise.race([operation(), timeoutPromise]);
    };

    if (retryOptions) {
      const defaultRetryOptions: RetryOptions = {
        maxAttempts: 3,
        delay: 1000,
        exponentialBackoff: true,
        retryCondition: (error) => this.isRetryableError(error),
        ...retryOptions,
      };
      
      return this.retryAsync(wrappedOperation, context, defaultRetryOptions);
    }

    return this.handleAsync(wrappedOperation, context);
  }

  /**
   * Transform errors into appropriate HTTP exceptions
   */
  private static transformError(error: any, context: ErrorContext): HttpException {
    // Already an HTTP exception
    if (error instanceof HttpException) {
      return error;
    }

    // Network/timeout errors
    if (this.isNetworkError(error)) {
      return new HttpException(
        'Service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    // Validation errors
    if (this.isValidationError(error)) {
      return new HttpException(
        error.message || 'Validation failed',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Authentication errors
    if (this.isAuthError(error)) {
      return new HttpException(
        'Authentication failed',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Authorization errors
    if (this.isAuthorizationError(error)) {
      return new HttpException(
        'Access denied',
        HttpStatus.FORBIDDEN,
      );
    }

    // Default to internal server error
    return new HttpException(
      'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Transform database errors into appropriate HTTP exceptions
   */
  private static transformDatabaseError(error: QueryFailedError): HttpException {
    const message = error.message.toLowerCase();

    if (message.includes('unique constraint') || message.includes('duplicate')) {
      return new HttpException(
        'Resource already exists',
        HttpStatus.CONFLICT,
      );
    }

    if (message.includes('foreign key constraint')) {
      return new HttpException(
        'Referenced resource not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (message.includes('not null constraint')) {
      return new HttpException(
        'Required field missing',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (message.includes('connection') || message.includes('timeout')) {
      return new HttpException(
        'Database temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return new HttpException(
      'Database operation failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
   * Log errors with context
   */
  private static logError(error: any, context: ErrorContext): void {
    const logData = {
      service: context.service,
      method: context.method,
      tenantId: context.tenantId,
      userId: context.userId,
      requestId: context.requestId,
      metadata: context.metadata,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      timestamp: new Date().toISOString(),
    };

    if (error instanceof HttpException && error.getStatus() < 500) {
      this.logger.warn(`Client error in ${context.service}.${context.method}`, logData);
    } else {
      this.logger.error(`Server error in ${context.service}.${context.method}`, logData);
    }
  }

  /**
   * Log database errors with query context
   */
  private static logDatabaseError(error: QueryFailedError, context: ErrorContext): void {
    const logData = {
      service: context.service,
      method: context.method,
      tenantId: context.tenantId,
      userId: context.userId,
      requestId: context.requestId,
      metadata: context.metadata,
      error: {
        name: error.name,
        message: error.message,
        query: error.query,
        parameters: error.parameters,
      },
      timestamp: new Date().toISOString(),
    };

    this.logger.error(`Database error in ${context.service}.${context.method}`, logData);
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: any): boolean {
    // Network errors
    if (this.isNetworkError(error)) {
      return true;
    }

    // Timeout errors
    if (error.message?.includes('timeout')) {
      return true;
    }

    // Rate limit errors
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return true;
    }

    // Server errors (5xx)
    if (error.status >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Check if error is a network error
   */
  private static isNetworkError(error: any): boolean {
    const networkErrors = [
      'ENOTFOUND',
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENETUNREACH',
      'EHOSTUNREACH',
    ];

    return networkErrors.some(code => 
      error.code === code || error.message?.includes(code)
    );
  }

  /**
   * Check if error is a validation error
   */
  private static isValidationError(error: any): boolean {
    return error.name === 'ValidationError' || 
           error.name === 'ValidatorError' ||
           error.message?.includes('validation');
  }

  /**
   * Check if error is an authentication error
   */
  private static isAuthError(error: any): boolean {
    return error.name === 'UnauthorizedError' ||
           error.name === 'JsonWebTokenError' ||
           error.name === 'TokenExpiredError' ||
           error.status === 401;
  }

  /**
   * Check if error is an authorization error
   */
  private static isAuthorizationError(error: any): boolean {
    return error.name === 'ForbiddenError' ||
           error.status === 403;
  }

  /**
   * Sleep utility for retry delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}