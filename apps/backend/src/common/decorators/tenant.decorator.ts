import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Decorator to extract tenant information from the request
 * Can be used to get tenant ID, tenant object, or specific tenant properties
 */
export const Tenant = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { tenant?: any }>();
    const tenant = request.tenant;

    if (!tenant) {
      return null;
    }

    return data ? tenant[data] : tenant;
  },
);

/**
 * Decorator to extract tenant ID from the request
 */
export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request & { tenant?: any }>();
    return request.tenant?.id || null;
  },
);

/**
 * Decorator to extract tenant slug from the request
 */
export const TenantSlug = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request & { tenant?: any }>();
    return request.tenant?.slug || null;
  },
);

/**
 * Decorator to extract tenant domain from the request
 */
export const TenantDomain = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request & { tenant?: any }>();
    return request.tenant?.domain || null;
  },
);