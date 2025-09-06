import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Decorator to extract user information from the request
 * Can be used to get user ID, user object, or specific user properties
 */
export const User = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: any }>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);

/**
 * Decorator to extract user ID from the request
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: any }>();
    return request.user?.id || null;
  },
);

/**
 * Decorator to extract user email from the request
 */
export const UserEmail = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: any }>();
    return request.user?.email || null;
  },
);

/**
 * Decorator to extract user roles from the request
 */
export const UserRoles = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: any }>();
    return request.user?.roles || [];
  },
);

/**
 * Decorator to extract user permissions from the request
 */
export const UserPermissions = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: any }>();
    return request.user?.permissions || [];
  },
);