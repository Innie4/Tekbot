import { HttpStatus } from '@nestjs/common';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    tenantId?: string;
    userId?: string;
    version?: string;
    pagination?: PaginationMeta;
  };
  errors?: any[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  meta: ApiResponse['meta'] & {
    pagination: PaginationMeta;
  };
}

export class ResponseUtil {
  /**
   * Create a successful response
   */
  static success<T>(
    data?: T,
    message: string = 'Operation successful',
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  /**
   * Create an error response
   */
  static error(
    message: string = 'Operation failed',
    errors?: any[],
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return {
      success: false,
      message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  /**
   * Create a paginated response
   */
  static paginated<T>(
    data: T[],
    pagination: PaginationMeta,
    message: string = 'Data retrieved successfully',
    meta?: Partial<ApiResponse['meta']>,
  ): PaginatedResponse<T> {
    return {
      success: true,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination,
        ...meta,
      },
    };
  }

  /**
   * Create pagination metadata
   */
  static createPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMeta {
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

  /**
   * Create a created response (201)
   */
  static created<T>(
    data?: T,
    message: string = 'Resource created successfully',
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse<T> {
    return this.success(data, message, meta);
  }

  /**
   * Create a no content response (204)
   */
  static noContent(
    message: string = 'Operation completed successfully',
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return {
      success: true,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  /**
   * Create a bad request response (400)
   */
  static badRequest(
    message: string = 'Bad request',
    errors?: any[],
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return this.error(message, errors, meta);
  }

  /**
   * Create an unauthorized response (401)
   */
  static unauthorized(
    message: string = 'Unauthorized access',
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return this.error(message, undefined, meta);
  }

  /**
   * Create a forbidden response (403)
   */
  static forbidden(
    message: string = 'Access forbidden',
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return this.error(message, undefined, meta);
  }

  /**
   * Create a not found response (404)
   */
  static notFound(
    message: string = 'Resource not found',
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return this.error(message, undefined, meta);
  }

  /**
   * Create a conflict response (409)
   */
  static conflict(
    message: string = 'Resource conflict',
    errors?: any[],
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return this.error(message, errors, meta);
  }

  /**
   * Create an unprocessable entity response (422)
   */
  static unprocessableEntity(
    message: string = 'Unprocessable entity',
    errors?: any[],
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return this.error(message, errors, meta);
  }

  /**
   * Create a too many requests response (429)
   */
  static tooManyRequests(
    message: string = 'Too many requests',
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return this.error(message, undefined, meta);
  }

  /**
   * Create an internal server error response (500)
   */
  static internalServerError(
    message: string = 'Internal server error',
    errors?: any[],
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return this.error(message, errors, meta);
  }

  /**
   * Create a service unavailable response (503)
   */
  static serviceUnavailable(
    message: string = 'Service unavailable',
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse {
    return this.error(message, undefined, meta);
  }

  /**
   * Transform any data into a standardized response
   */
  static transform<T>(
    data: T,
    message?: string,
    meta?: Partial<ApiResponse['meta']>,
  ): ApiResponse<T> | PaginatedResponse<any> {
    // Handle null/undefined data
    if (data === null || data === undefined) {
      return this.success(data, message || 'No data found', meta);
    }

    // Handle arrays (potential pagination)
    if (Array.isArray(data)) {
      return this.success(data, message || 'Data retrieved successfully', meta);
    }

    // Handle objects with pagination info
    if (typeof data === 'object' && 'data' in data && 'pagination' in data) {
      const { data: items, pagination, ...rest } = data as any;
      return this.paginated(
        items,
        pagination,
        message || 'Data retrieved successfully',
        { ...meta, ...rest },
      );
    }

    // Handle regular data
    return this.success(data, message || 'Operation successful', meta);
  }

  /**
   * Extract error details from various error types
   */
  static extractErrorDetails(error: any): {
    message: string;
    statusCode: number;
    errors?: any[];
  } {
    // NestJS HttpException
    if (error.getStatus && error.getResponse) {
      const response = error.getResponse();
      return {
        message: typeof response === 'string' ? response : response.message || error.message,
        statusCode: error.getStatus(),
        errors: typeof response === 'object' && response.errors ? response.errors : undefined,
      };
    }

    // Validation errors
    if (error.name === 'ValidationError' && error.errors) {
      return {
        message: 'Validation failed',
        statusCode: HttpStatus.BAD_REQUEST,
        errors: Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message,
          value: err.value,
        })),
      };
    }

    // MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return {
        message: `Duplicate ${field} already exists`,
        statusCode: HttpStatus.CONFLICT,
      };
    }

    // MongoDB cast error
    if (error.name === 'CastError') {
      return {
        message: `Invalid ${error.path}: ${error.value}`,
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return {
        message: 'Invalid token',
        statusCode: HttpStatus.UNAUTHORIZED,
      };
    }

    if (error.name === 'TokenExpiredError') {
      return {
        message: 'Token expired',
        statusCode: HttpStatus.UNAUTHORIZED,
      };
    }

    // Default error
    return {
      message: error.message || 'Internal server error',
      statusCode: error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }
}