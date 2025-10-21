import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    tenantId?: string;
    userId?: string;
    version: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any; tenant?: any; requestId?: string }>();
    const response = context.switchToHttp().getResponse<Response>();

    // Check if response transformation should be skipped
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      'skipTransform',
      [context.getHandler(), context.getClass()],
    );

    if (skipTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      map(data => {
        // Handle different response types
        if (this.isAlreadyTransformed(data)) {
          return data;
        }

        // Get custom message from metadata
        const customMessage = this.reflector.getAllAndOverride<string>(
          'responseMessage',
          [context.getHandler(), context.getClass()],
        );

        // Build response
        const apiResponse: ApiResponse<T> = {
          success: true,
          message:
            customMessage ||
            this.getDefaultMessage(request.method, response.statusCode),
          data: this.transformData(data),
          meta: {
            timestamp: new Date().toISOString(),
            requestId: request.requestId,
            tenantId: request.tenant?.id,
            userId: request.user?.id,
            version: process.env.API_VERSION || '1.0.0',
          },
        };

        // Add pagination meta if data contains pagination info
        if (this.hasPaginationInfo(data)) {
          apiResponse.meta!.pagination = this.extractPaginationMeta(data);
        }

        // Set response headers
        this.setResponseHeaders(response, apiResponse);

        return apiResponse;
      }),
    );
  }

  private isAlreadyTransformed(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      'message' in data &&
      'data' in data
    );
  }

  private transformData(data: any): any {
    // Handle null or undefined
    if (data === null || data === undefined) {
      return null;
    }

    // Handle pagination response
    if (this.hasPaginationInfo(data)) {
      return {
        items: data.items || data.data || [],
        ...this.extractPaginationMeta(data),
      };
    }

    // Handle array responses
    if (Array.isArray(data)) {
      return data;
    }

    // Handle object responses
    if (typeof data === 'object') {
      return data;
    }

    // Handle primitive responses
    return data;
  }

  private hasPaginationInfo(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      (('items' in data && 'total' in data) ||
        ('data' in data && 'total' in data) ||
        ('page' in data && 'limit' in data && 'total' in data))
    );
  }

  private extractPaginationMeta(data: any): PaginationMeta {
    const page = data.page || data.currentPage || 1;
    const limit = data.limit || data.pageSize || data.perPage || 10;
    const total = data.total || data.totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  private getDefaultMessage(method: string, statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) {
      switch (method.toUpperCase()) {
        case 'GET':
          return 'Data retrieved successfully';
        case 'POST':
          return 'Resource created successfully';
        case 'PUT':
        case 'PATCH':
          return 'Resource updated successfully';
        case 'DELETE':
          return 'Resource deleted successfully';
        default:
          return 'Operation completed successfully';
      }
    }

    return 'Operation completed';
  }

  private setResponseHeaders(
    response: Response,
    apiResponse: ApiResponse<any>,
  ): void {
    // Set standard headers
    response.setHeader('X-API-Version', apiResponse.meta?.version || '1.0.0');
    response.setHeader('X-Request-ID', apiResponse.meta?.requestId || '');

    if (apiResponse.meta?.tenantId) {
      response.setHeader('X-Tenant-ID', apiResponse.meta.tenantId);
    }

    // Set pagination headers if available
    if (apiResponse.meta?.pagination) {
      const { page, limit, total, totalPages, hasNext, hasPrev } =
        apiResponse.meta.pagination;

      response.setHeader('X-Total-Count', total.toString());
      response.setHeader('X-Page-Count', totalPages.toString());
      response.setHeader('X-Current-Page', page.toString());
      response.setHeader('X-Per-Page', limit.toString());
      response.setHeader('X-Has-Next', hasNext.toString());
      response.setHeader('X-Has-Prev', hasPrev.toString());
    }

    // Set cache headers for GET requests
    if (response.req?.method === 'GET') {
      response.setHeader(
        'Cache-Control',
        'no-cache, no-store, must-revalidate',
      );
      response.setHeader('Pragma', 'no-cache');
      response.setHeader('Expires', '0');
    }
  }
}

// Decorator to skip response transformation
export const SkipTransform = () => SetMetadata('skipTransform', true);

// Decorator to set custom response message
export const ResponseMessage = (message: string) =>
  SetMetadata('responseMessage', message);
