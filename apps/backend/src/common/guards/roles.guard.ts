import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    const user = request.user;

    // If no user is attached, let the auth guard handle it
    if (!user) {
      return true;
    }

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get required roles from metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get required permissions from metadata
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get any role requirement (OR logic)
    const anyRoles = this.reflector.getAllAndOverride<string[]>('anyRole', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get all roles requirement (AND logic)
    const allRoles = this.reflector.getAllAndOverride<string[]>('allRoles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Check owner-only access
    const ownerOnly = this.reflector.getAllAndOverride<boolean>('ownerOnly', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Get ownership field for resource-based authorization
    const ownershipField = this.reflector.getAllAndOverride<string>('ownershipField', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no role/permission requirements, allow access
    if (!requiredRoles && !requiredPermissions && !anyRoles && !allRoles && !ownerOnly) {
      return true;
    }

    const userRoles = user.roles || [];
    const userPermissions = user.permissions || [];

    // Check owner-only access
    if (ownerOnly) {
      const resourceOwnerId = this.getResourceOwnerId(request, ownershipField);
      if (resourceOwnerId && resourceOwnerId !== user.id) {
        // Allow if user has admin role
        if (!this.hasAnyRole(userRoles, ['admin', 'super_admin'])) {
          throw new ForbiddenException('Access denied: You can only access your own resources');
        }
      }
    }

    // Check required roles (exact match)
    if (requiredRoles && requiredRoles.length > 0) {
      if (!this.hasAnyRole(userRoles, requiredRoles)) {
        throw new ForbiddenException(`Access denied: Required roles: ${requiredRoles.join(', ')}`);
      }
    }

    // Check any roles (OR logic)
    if (anyRoles && anyRoles.length > 0) {
      if (!this.hasAnyRole(userRoles, anyRoles)) {
        throw new ForbiddenException(`Access denied: Required any of roles: ${anyRoles.join(', ')}`);
      }
    }

    // Check all roles (AND logic)
    if (allRoles && allRoles.length > 0) {
      if (!this.hasAllRoles(userRoles, allRoles)) {
        throw new ForbiddenException(`Access denied: Required all roles: ${allRoles.join(', ')}`);
      }
    }

    // Check required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!this.hasAnyPermission(userPermissions, requiredPermissions)) {
        throw new ForbiddenException(`Access denied: Required permissions: ${requiredPermissions.join(', ')}`);
      }
    }

    return true;
  }

  private hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.some(role => userRoles.includes(role));
  }

  private hasAllRoles(userRoles: string[], requiredRoles: string[]): boolean {
    return requiredRoles.every(role => userRoles.includes(role));
  }

  private hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  private getResourceOwnerId(request: Request, ownershipField: string = 'userId'): string | null {
    // Try to get owner ID from request params
    if (request.params?.id) {
      return request.params.id;
    }

    // Try to get owner ID from request body
    if (request.body?.[ownershipField]) {
      return request.body[ownershipField];
    }

    // Try to get owner ID from query params
    if (request.query?.[ownershipField]) {
      return request.query[ownershipField] as string;
    }

    return null;
  }
}