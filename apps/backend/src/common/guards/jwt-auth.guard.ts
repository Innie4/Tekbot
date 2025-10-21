import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): any {
    const request = context.switchToHttp().getRequest<Request>();

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return user || null;
    }

    if (err || !user) {
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      if (info?.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active');
      }

      throw new UnauthorizedException('Authentication required');
    }

    // Check if user account is active
    if (user.status !== 'active') {
      throw new ForbiddenException('Account is not active');
    }

    // Check if user is verified (if email verification is required)
    if (
      user.emailVerified === false &&
      this.isEmailVerificationRequired(request)
    ) {
      throw new ForbiddenException('Email verification required');
    }

    // Attach user to request
    request.user = user;

    return user;
  }

  private isEmailVerificationRequired(request: Request): boolean {
    // Define routes that require email verification
    const verificationRequiredRoutes = [
      '/api/v1/users/profile',
      '/api/v1/payments',
      '/api/v1/appointments',
      '/api/v1/admin',
    ];

    return verificationRequiredRoutes.some(route =>
      request.path.startsWith(route),
    );
  }
}
