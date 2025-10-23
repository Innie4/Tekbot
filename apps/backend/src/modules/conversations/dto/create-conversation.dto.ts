import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  tenantId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(['active', 'closed', 'archived'])
  status?: 'active' | 'closed' | 'archived';

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  referrer?: string;
}
