import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsObject,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateWidgetConfigDto {
  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  welcomeMessage?: string;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsEnum(['bottom-right', 'bottom-left', 'top-right', 'top-left'])
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  @IsOptional()
  @IsObject()
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    textColor?: string;
    backgroundColor?: string;
    borderRadius?: string;
    fontFamily?: string;
    fontSize?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    headerColor?: string;
    headerTextColor?: string;
  };

  @IsOptional()
  @IsObject()
  branding?: {
    logo?: string;
    companyName?: string;
    showPoweredBy?: boolean;
    customCSS?: string;
  };

  @IsOptional()
  @IsObject()
  behavior?: {
    autoOpen?: boolean;
    autoOpenDelay?: number;
    showOnPages?: string[];
    hideOnPages?: string[];
    enableSound?: boolean;
    enableTypingIndicator?: boolean;
    maxHeight?: string;
    maxWidth?: string;
  };

  @IsOptional()
  @IsObject()
  security?: {
    allowedDomains?: string[];
    requireAuth?: boolean;
    enableRateLimit?: boolean;
    rateLimitRequests?: number;
    rateLimitWindow?: number;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}
