import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

interface ValidationPipeOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  skipMissingProperties?: boolean;
  skipNullProperties?: boolean;
  skipUndefinedProperties?: boolean;
  stopAtFirstError?: boolean;
  groups?: string[];
  always?: boolean;
  strictGroups?: boolean;
  dismissDefaultMessages?: boolean;
  validationError?: {
    target?: boolean;
    value?: boolean;
  };
  forbidUnknownValues?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  private readonly logger = new Logger(CustomValidationPipe.name);
  
  private readonly options: ValidationPipeOptions;

  constructor(options: ValidationPipeOptions = {}) {
    this.options = {
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      stopAtFirstError: false,
      forbidUnknownValues: true,
      validationError: {
        target: false,
        value: false,
      },
      ...options,
    };
  }

  async transform(value: any, { metatype, type, data }: ArgumentMetadata) {
    // Skip validation for primitive types
    if (!metatype || !this.toValidate(metatype)) {
      return this.options.transform ? this.transformPrimitive(value, metatype) : value;
    }

    // Transform plain object to class instance
    const object = plainToClass(metatype, value, {
      enableImplicitConversion: this.options.transform,
      excludeExtraneousValues: this.options.whitelist,
    });

    // Validate the object
    const errors = await validate(object, {
      whitelist: this.options.whitelist,
      forbidNonWhitelisted: this.options.forbidNonWhitelisted,
      skipMissingProperties: this.options.skipMissingProperties,
      skipNullProperties: this.options.skipNullProperties,
      skipUndefinedProperties: this.options.skipUndefinedProperties,
      stopAtFirstError: this.options.stopAtFirstError,
      groups: this.options.groups,
      always: this.options.always,
      strictGroups: this.options.strictGroups,
      dismissDefaultMessages: this.options.dismissDefaultMessages,
      validationError: this.options.validationError,
      forbidUnknownValues: this.options.forbidUnknownValues,
    });

    if (errors.length > 0) {
      // Log validation errors for debugging
      this.logger.warn('Validation failed', {
        type,
        data,
        errors: this.formatErrors(errors),
        value: this.sanitizeValue(value),
      });

      // Throw validation exception
      const exception = this.options.exceptionFactory
        ? this.options.exceptionFactory(errors)
        : new BadRequestException(this.formatValidationErrors(errors));
      
      throw exception;
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private transformPrimitive(value: any, metatype?: Function): any {
    if (!metatype || value === null || value === undefined) {
      return value;
    }

    if (metatype === Boolean) {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return Boolean(value);
    }

    if (metatype === Number) {
      const num = Number(value);
      if (isNaN(num)) {
        throw new BadRequestException(`Invalid number: ${value}`);
      }
      return num;
    }

    if (metatype === String) {
      return String(value);
    }

    return value;
  }

  private formatValidationErrors(errors: ValidationError[]): any {
    const formatError = (error: ValidationError): any => {
      const result: any = {
        property: error.property,
        value: error.value,
        constraints: error.constraints || {},
      };

      if (error.children && error.children.length > 0) {
        result.children = error.children.map(formatError);
      }

      return result;
    };

    return {
      message: 'Validation failed',
      statusCode: 400,
      error: 'Bad Request',
      details: errors.map(formatError),
    };
  }

  private formatErrors(errors: ValidationError[]): any[] {
    const formatError = (error: ValidationError, path: string = ''): any[] => {
      const currentPath = path ? `${path}.${error.property}` : error.property;
      const result: any[] = [];

      if (error.constraints) {
        Object.keys(error.constraints).forEach(key => {
          result.push({
            property: currentPath,
            constraint: key,
            message: error.constraints![key],
            value: error.value,
          });
        });
      }

      if (error.children && error.children.length > 0) {
        error.children.forEach(child => {
          result.push(...formatError(child, currentPath));
        });
      }

      return result;
    };

    return errors.flatMap(error => formatError(error));
  }

  private sanitizeValue(value: any): any {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const sensitiveFields = [
      'password',
      'confirmPassword',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'accessToken',
      'apiKey',
      'secret',
      'creditCard',
      'ssn',
    ];

    const sanitized = { ...value };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

// Factory function for creating validation pipe with custom options
export function createValidationPipe(options: ValidationPipeOptions = {}): CustomValidationPipe {
  return new CustomValidationPipe(options);
}

// Predefined validation pipes for common use cases
export const StrictValidationPipe = new CustomValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  stopAtFirstError: false,
});

export const TransformValidationPipe = new CustomValidationPipe({
  transform: true,
  whitelist: false,
  forbidNonWhitelisted: false,
});

export const WhitelistValidationPipe = new CustomValidationPipe({
  transform: false,
  whitelist: true,
  forbidNonWhitelisted: true,
});