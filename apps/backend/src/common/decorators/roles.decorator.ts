import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/**
 * Decorator to set required roles for a route or controller
 * @param roles - Array of role names required to access the resource
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

/**
 * Decorator to set required permissions for a route or controller
 * @param permissions - Array of permission names required to access the resource
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

/**
 * Decorator to mark a route as public (no authentication required)
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Decorator to mark a route as requiring admin access
 */
export const AdminOnly = () => SetMetadata('roles', ['admin']);

/**
 * Decorator to mark a route as requiring super admin access
 */
export const SuperAdminOnly = () => SetMetadata('roles', ['super_admin']);

/**
 * Decorator to mark a route as requiring owner access (user can only access their own resources)
 */
export const OwnerOnly = () => SetMetadata('ownerOnly', true);

/**
 * Decorator to mark a route as requiring tenant admin access
 */
export const TenantAdminOnly = () => SetMetadata('roles', ['tenant_admin']);

/**
 * Decorator to set resource ownership field for authorization
 * @param field - The field name that contains the owner ID (default: 'userId')
 */
export const ResourceOwnership = (field: string = 'userId') =>
  SetMetadata('ownershipField', field);

/**
 * Decorator to allow multiple roles with OR logic
 * @param roles - Array of role names, user needs at least one of these roles
 */
export const AnyRole = (...roles: string[]) => SetMetadata('anyRole', roles);

/**
 * Decorator to require all specified roles with AND logic
 * @param roles - Array of role names, user needs all of these roles
 */
export const AllRoles = (...roles: string[]) => SetMetadata('allRoles', roles);
