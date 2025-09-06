import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { ThrottlerGuard, ThrottlerException, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';

interface ThrottleConfig {
  ttl: number; // Time to live in seconds
  limit: number; // Number of requests
  skipIf?: (context: ExecutionContext) => boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  generateKey?: (context: ExecutionContext) => string;
}

@Injectable()
export class CustomThrottleGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    const response = context.switchToHttp().getResponse<Response>();

    // Check if route is marked as public or should skip throttling
    const skipThrottle = this.reflector.getAllAndOverride<boolean>('skipThrottle', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipThrottle) {
      return true;
    }

    // Get custom throttle configuration
    const throttleConfig = this.reflector.getAllAndOverride<ThrottleConfig>('throttleConfig', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check if should skip based on custom logic
    if (throttleConfig?.skipIf && throttleConfig.skipIf(context)) {
      return true;
    }

    try {
      // Use parent throttler logic
      const result = await super.canActivate(context);
      
      // Add rate limit headers
      this.addRateLimitHeaders(response, request, throttleConfig);
      
      return result;
    } catch (error) {
      if (error instanceof ThrottlerException) {
        // Add rate limit headers even when throttled
        this.addRateLimitHeaders(response, request, throttleConfig, true);
        
        // Customize throttle error message
        const customMessage = this.getCustomThrottleMessage(request, throttleConfig);
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: customMessage,
            error: 'Too Many Requests',
            retryAfter: this.getRetryAfter(throttleConfig),
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw error;
    }
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Get custom key generator from metadata
    const context = this.getExecutionContext(req);
    const throttleConfig = this.reflector.getAllAndOverride<ThrottleConfig>('throttleConfig', [
      context?.getHandler(),
      context?.getClass(),
    ]);

    if (throttleConfig?.generateKey) {
      return throttleConfig.generateKey(context);
    }

    // Default tracking by IP and user ID (if authenticated)
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userId = req.user?.id;
    
    if (userId) {
      return `user:${userId}`;
    }
    
    return `ip:${ip}`;
  }

  private getExecutionContext(req: any): ExecutionContext | null {
    // This is a workaround to get execution context in getTracker
    // In a real implementation, you might need to store this differently
    return req.__executionContext || null;
  }

  private addRateLimitHeaders(
    response: Response,
    request: Request,
    config?: ThrottleConfig,
    isThrottled: boolean = false,
  ): void {
    const limit = config?.limit || 100;
    const ttl = config?.ttl || 60;
    
    // Add standard rate limit headers
    response.setHeader('X-RateLimit-Limit', limit.toString());
    response.setHeader('X-RateLimit-Window', ttl.toString());
    
    if (isThrottled) {
      response.setHeader('X-RateLimit-Remaining', '0');
      response.setHeader('Retry-After', this.getRetryAfter(config).toString());
    } else {
      // In a real implementation, you'd track remaining requests
      response.setHeader('X-RateLimit-Remaining', (limit - 1).toString());
    }
  }

  private getCustomThrottleMessage(request: Request, config?: ThrottleConfig): string {
    const limit = config?.limit || 100;
    const ttl = config?.ttl || 60;
    const retryAfter = this.getRetryAfter(config);
    
    const endpoint = request.path;
    const method = request.method;
    
    return `Rate limit exceeded for ${method} ${endpoint}. ` +
           `Limit: ${limit} requests per ${ttl} seconds. ` +
           `Please try again in ${retryAfter} seconds.`;
  }

  private getRetryAfter(config?: ThrottleConfig): number {
    return config?.ttl || 60;
  }
}

// Decorator for custom throttle configuration
export const CustomThrottle = (config: ThrottleConfig) => SetMetadata('throttleConfig', config);

export const SkipThrottle = () => SetMetadata('skipThrottle', true);