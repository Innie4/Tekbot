import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  private readonly logger = new Logger(ParseUUIDPipe.name);

  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException('UUID is required');
    }

    if (!isUUID(value)) {
      this.logger.warn(`Invalid UUID provided: ${value}`);
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }

    return value;
  }
}

@Injectable()
export class ParseOptionalUUIDPipe
  implements PipeTransform<string | undefined, string | undefined>
{
  private readonly logger = new Logger(ParseOptionalUUIDPipe.name);

  transform(
    value: string | undefined,
    metadata: ArgumentMetadata,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    if (!isUUID(value)) {
      this.logger.warn(`Invalid UUID provided: ${value}`);
      throw new BadRequestException(`Invalid UUID: ${value}`);
    }

    return value;
  }
}

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  private readonly logger = new Logger(ParseIntPipe.name);

  constructor(
    private readonly options: {
      min?: number;
      max?: number;
      errorHttpStatusCode?: number;
      exceptionFactory?: (error: string) => any;
    } = {},
  ) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException('Numeric value is required');
    }

    const val = parseInt(value, 10);

    if (isNaN(val)) {
      const errorMessage = `Validation failed (numeric string is expected): ${value}`;
      this.logger.warn(errorMessage);

      if (this.options.exceptionFactory) {
        throw this.options.exceptionFactory(errorMessage);
      }

      throw new BadRequestException(errorMessage);
    }

    if (this.options.min !== undefined && val < this.options.min) {
      const errorMessage = `Value must be at least ${this.options.min}, got ${val}`;
      this.logger.warn(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    if (this.options.max !== undefined && val > this.options.max) {
      const errorMessage = `Value must be at most ${this.options.max}, got ${val}`;
      this.logger.warn(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    return val;
  }
}

@Injectable()
export class ParseFloatPipe implements PipeTransform<string, number> {
  private readonly logger = new Logger(ParseFloatPipe.name);

  constructor(
    private readonly options: {
      min?: number;
      max?: number;
      precision?: number;
      errorHttpStatusCode?: number;
      exceptionFactory?: (error: string) => any;
    } = {},
  ) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException('Numeric value is required');
    }

    const val = parseFloat(value);

    if (isNaN(val)) {
      const errorMessage = `Validation failed (numeric string is expected): ${value}`;
      this.logger.warn(errorMessage);

      if (this.options.exceptionFactory) {
        throw this.options.exceptionFactory(errorMessage);
      }

      throw new BadRequestException(errorMessage);
    }

    if (this.options.min !== undefined && val < this.options.min) {
      const errorMessage = `Value must be at least ${this.options.min}, got ${val}`;
      this.logger.warn(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    if (this.options.max !== undefined && val > this.options.max) {
      const errorMessage = `Value must be at most ${this.options.max}, got ${val}`;
      this.logger.warn(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    // Apply precision if specified
    if (this.options.precision !== undefined) {
      return parseFloat(val.toFixed(this.options.precision));
    }

    return val;
  }
}

@Injectable()
export class ParseBoolPipe implements PipeTransform<string | boolean, boolean> {
  private readonly logger = new Logger(ParseBoolPipe.name);

  transform(value: string | boolean, metadata: ArgumentMetadata): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (value === undefined || value === null) {
      throw new BadRequestException('Boolean value is required');
    }

    const val = value.toString().toLowerCase();

    if (val === 'true' || val === '1' || val === 'yes' || val === 'on') {
      return true;
    }

    if (val === 'false' || val === '0' || val === 'no' || val === 'off') {
      return false;
    }

    const errorMessage = `Validation failed (boolean string is expected): ${value}`;
    this.logger.warn(errorMessage);
    throw new BadRequestException(errorMessage);
  }
}

@Injectable()
export class ParseArrayPipe
  implements PipeTransform<string | string[], string[]>
{
  private readonly logger = new Logger(ParseArrayPipe.name);

  constructor(
    private readonly options: {
      separator?: string;
      items?: 'string' | 'number' | 'boolean';
      optional?: boolean;
      min?: number;
      max?: number;
    } = {},
  ) {
    this.options = {
      separator: ',',
      items: 'string',
      optional: false,
      ...options,
    };
  }

  transform(value: string | string[], metadata: ArgumentMetadata): string[] {
    if (!value) {
      if (this.options.optional) {
        return [];
      }
      throw new BadRequestException('Array value is required');
    }

    let array: string[];

    if (Array.isArray(value)) {
      array = value;
    } else if (typeof value === 'string') {
      array = value
        .split(this.options.separator!)
        .map(item => item.trim())
        .filter(item => item);
    } else {
      throw new BadRequestException('Invalid array format');
    }

    // Validate array length
    if (this.options.min !== undefined && array.length < this.options.min) {
      throw new BadRequestException(
        `Array must have at least ${this.options.min} items`,
      );
    }

    if (this.options.max !== undefined && array.length > this.options.max) {
      throw new BadRequestException(
        `Array must have at most ${this.options.max} items`,
      );
    }

    // Transform items based on type
    if (this.options.items === 'number') {
      return array.map(item => {
        const num = parseFloat(item);
        if (isNaN(num)) {
          throw new BadRequestException(`Invalid number in array: ${item}`);
        }
        return num.toString();
      });
    }

    if (this.options.items === 'boolean') {
      return array.map(item => {
        const bool = item.toLowerCase();
        if (
          !['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(bool)
        ) {
          throw new BadRequestException(`Invalid boolean in array: ${item}`);
        }
        return ['true', '1', 'yes', 'on'].includes(bool) ? 'true' : 'false';
      });
    }

    return array;
  }
}

@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  private readonly logger = new Logger(ParseDatePipe.name);

  constructor(
    private readonly options: {
      format?: 'iso' | 'timestamp' | 'any';
      min?: Date;
      max?: Date;
    } = {},
  ) {
    this.options = {
      format: 'any',
      ...options,
    };
  }

  transform(value: string, metadata: ArgumentMetadata): Date {
    if (!value) {
      throw new BadRequestException('Date value is required');
    }

    let date: Date;

    if (this.options.format === 'timestamp') {
      const timestamp = parseInt(value, 10);
      if (isNaN(timestamp)) {
        throw new BadRequestException(`Invalid timestamp: ${value}`);
      }
      date = new Date(timestamp);
    } else if (this.options.format === 'iso') {
      date = new Date(value);
      if (
        isNaN(date.getTime()) ||
        !value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      ) {
        throw new BadRequestException(`Invalid ISO date: ${value}`);
      }
    } else {
      date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new BadRequestException(`Invalid date: ${value}`);
      }
    }

    // Validate date range
    if (this.options.min && date < this.options.min) {
      throw new BadRequestException(
        `Date must be after ${this.options.min.toISOString()}`,
      );
    }

    if (this.options.max && date > this.options.max) {
      throw new BadRequestException(
        `Date must be before ${this.options.max.toISOString()}`,
      );
    }

    return date;
  }
}

@Injectable()
export class ParseEnumPipe implements PipeTransform<string, string> {
  private readonly logger = new Logger(ParseEnumPipe.name);

  constructor(
    private readonly enumObject: Record<string, any>,
    private readonly options: {
      caseSensitive?: boolean;
      errorMessage?: string;
    } = {},
  ) {
    this.options = {
      caseSensitive: true,
      ...options,
    };
  }

  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException('Enum value is required');
    }

    const enumValues = Object.values(this.enumObject);
    const enumKeys = Object.keys(this.enumObject);

    let isValid = false;
    let normalizedValue = value;

    if (this.options.caseSensitive) {
      isValid = enumValues.includes(value) || enumKeys.includes(value);
    } else {
      const lowerValue = value.toLowerCase();
      isValid =
        enumValues.some(v => v.toString().toLowerCase() === lowerValue) ||
        enumKeys.some(k => k.toLowerCase() === lowerValue);

      if (isValid) {
        // Find the correct case
        normalizedValue =
          enumValues.find(v => v.toString().toLowerCase() === lowerValue) ||
          enumKeys.find(k => k.toLowerCase() === lowerValue) ||
          value;
      }
    }

    if (!isValid) {
      const errorMessage =
        this.options.errorMessage ||
        `Invalid enum value: ${value}. Valid values are: ${enumValues.join(', ')}`;
      this.logger.warn(errorMessage);
      throw new BadRequestException(errorMessage);
    }

    return normalizedValue;
  }
}
