import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
  ApiTooManyRequestsResponse,
  getSchemaPath,
} from '@nestjs/swagger';

/**
 * Standard API response wrapper
 */
export class ApiResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
  errors?: any[];
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseDto<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    timestamp: string;
    requestId: string;
    version: string;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

/**
 * Decorator for successful responses with data
 * @param model - The data model type
 * @param description - Response description
 */
export const ApiSuccessResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Success',
) => {
  return applyDecorators(
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: description },
              data: { $ref: getSchemaPath(model) },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
                  requestId: { type: 'string', example: 'req_123456789' },
                  version: { type: 'string', example: 'v1' },
                },
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * Decorator for created responses
 * @param model - The data model type
 * @param description - Response description
 */
export const ApiCreatedSuccessResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Created successfully',
) => {
  return applyDecorators(
    ApiCreatedResponse({
      description,
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: description },
              data: { $ref: getSchemaPath(model) },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
                  requestId: { type: 'string', example: 'req_123456789' },
                  version: { type: 'string', example: 'v1' },
                },
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * Decorator for paginated responses
 * @param model - The data model type
 * @param description - Response description
 */
export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Paginated results',
) => {
  return applyDecorators(
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: description },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
                  requestId: { type: 'string', example: 'req_123456789' },
                  version: { type: 'string', example: 'v1' },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'number', example: 1 },
                      limit: { type: 'number', example: 10 },
                      total: { type: 'number', example: 100 },
                      totalPages: { type: 'number', example: 10 },
                      hasNext: { type: 'boolean', example: true },
                      hasPrev: { type: 'boolean', example: false },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * Decorator for standard error responses
 */
export const ApiErrorResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request',
      schema: {
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Bad Request' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email format' },
                code: { type: 'string', example: 'INVALID_FORMAT' },
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              requestId: { type: 'string', example: 'req_123456789' },
              version: { type: 'string', example: 'v1' },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      schema: {
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Unauthorized' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              requestId: { type: 'string', example: 'req_123456789' },
              version: { type: 'string', example: 'v1' },
            },
          },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Forbidden',
      schema: {
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Forbidden' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              requestId: { type: 'string', example: 'req_123456789' },
              version: { type: 'string', example: 'v1' },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Not Found',
      schema: {
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              requestId: { type: 'string', example: 'req_123456789' },
              version: { type: 'string', example: 'v1' },
            },
          },
        },
      },
    }),
    ApiConflictResponse({
      description: 'Conflict',
      schema: {
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource already exists' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              requestId: { type: 'string', example: 'req_123456789' },
              version: { type: 'string', example: 'v1' },
            },
          },
        },
      },
    }),
    ApiTooManyRequestsResponse({
      description: 'Too Many Requests',
      schema: {
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Rate limit exceeded' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              requestId: { type: 'string', example: 'req_123456789' },
              version: { type: 'string', example: 'v1' },
            },
          },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      schema: {
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Internal server error' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              requestId: { type: 'string', example: 'req_123456789' },
              version: { type: 'string', example: 'v1' },
            },
          },
        },
      },
    }),
  );
};

/**
 * Complete API documentation decorator
 * @param model - The success response model
 * @param description - Success response description
 */
export const ApiStandardResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Success',
) => {
  return applyDecorators(
    ApiSuccessResponse(model, description),
    ApiErrorResponses(),
  );
};

/**
 * Complete API documentation decorator for created responses
 * @param model - The success response model
 * @param description - Success response description
 */
export const ApiStandardCreatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Created successfully',
) => {
  return applyDecorators(
    ApiCreatedSuccessResponse(model, description),
    ApiErrorResponses(),
  );
};

/**
 * Complete API documentation decorator for paginated responses
 * @param model - The data model type
 * @param description - Response description
 */
export const ApiStandardPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Paginated results',
) => {
  return applyDecorators(
    ApiPaginatedResponse(model, description),
    ApiErrorResponses(),
  );
};