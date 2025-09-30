import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';

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
  private static requestCounts: Record<string, { count: number; windowStart: number }> = {};

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
    if (throttleConfig?.skipIf && throttleConfig.skipIf(context)) {
      return true;
    }

    // Real request tracking logic
    const key = request.ip || (request.user?.id ? `user-${request.user.id}` : 'anonymous');
    const limit = throttleConfig?.limit || 100;
    const ttl = throttleConfig?.ttl || 60; // seconds
    const now = Date.now();
    const windowStart = Math.floor(now / 1000 / ttl) * ttl * 1000;
    if (!CustomThrottleGuard.requestCounts[key] || CustomThrottleGuard.requestCounts[key].windowStart !== windowStart) {
      CustomThrottleGuard.requestCounts[key] = { count: 1, windowStart };
    } else {
      CustomThrottleGuard.requestCounts[key].count++;
    }
    const remaining = Math.max(0, limit - CustomThrottleGuard.requestCounts[key].count);
    this.addRateLimitHeaders(response, throttleConfig, remaining);
    response.setHeader('X-RateLimit-Remaining', remaining.toString());
    if (CustomThrottleGuard.requestCounts[key].count > limit) {
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
    return true;
  }

  // Helper to add rate limit headers
  private addRateLimitHeaders(response: Response, throttleConfig: ThrottleConfig | undefined, remaining: number) {
    response.setHeader('X-RateLimit-Limit', throttleConfig?.limit || 100);
    response.setHeader('X-RateLimit-Remaining', remaining);
    response.setHeader('X-RateLimit-Reset', throttleConfig?.ttl || 60);
  }

  // Helper to get custom throttle message
  private getCustomThrottleMessage(request: Request, throttleConfig: ThrottleConfig | undefined): string {
    return throttleConfig?.limit
      ? `Rate limit exceeded. Max ${throttleConfig.limit} requests per ${throttleConfig.ttl || 60} seconds.`
      : 'Too many requests.';
  }

  // Helper to get retry after value
  private getRetryAfter(throttleConfig: ThrottleConfig | undefined): number {
    return throttleConfig?.ttl || 60;
  }
}
