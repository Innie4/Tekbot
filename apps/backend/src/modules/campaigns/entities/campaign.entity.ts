import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum CampaignType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum TriggerType {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  EVENT_BASED = 'event_based',
  RECURRING = 'recurring'
}

@Entity('campaigns')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'type'])
@Index(['scheduledAt'])
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: CampaignType,
    default: CampaignType.EMAIL,
  })
  type: CampaignType;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({
    type: 'enum',
    enum: TriggerType,
    default: TriggerType.MANUAL,
  })
  triggerType: TriggerType;

  // Campaign content
  @Column({ length: 500, nullable: true })
  subject?: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'text', nullable: true })
  htmlContent?: string;

  @Column({ type: 'json', nullable: true })
  templateData?: Record<string, any>;

  // Legacy field for backward compatibility
  @Column({ type: 'text', nullable: true })
  message_template?: string;

  // Targeting and segmentation
  @Column({ type: 'json', nullable: true })
  targetAudience?: {
    segments?: string[];
    customerIds?: string[];
    filters?: Record<string, any>;
    excludeSegments?: string[];
  };

  @Column({ type: 'int', default: 0 })
  estimatedRecipients: number;

  // Scheduling
  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'json', nullable: true })
  recurringConfig?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: Date;
    maxOccurrences?: number;
  };

  // Event-based triggers (enhanced from legacy trigger_conditions)
  @Column({ type: 'json', nullable: true })
  eventTriggers?: {
    events: string[];
    conditions?: Record<string, any>;
    delay?: number; // in minutes
  };

  // Legacy field for backward compatibility
  @Column({ type: 'json', nullable: true })
  trigger_conditions?: Record<string, any>;

  // Campaign settings
  @Column({ type: 'json', nullable: true })
  settings?: {
    sendTime?: string; // HH:mm format
    timezone?: string;
    throttling?: {
      enabled: boolean;
      maxPerHour?: number;
      maxPerDay?: number;
    };
    tracking?: {
      openTracking: boolean;
      clickTracking: boolean;
      unsubscribeTracking: boolean;
    };
  };

  // Analytics and metrics
  @Column({ type: 'int', default: 0 })
  sentCount: number;

  @Column({ type: 'int', default: 0 })
  deliveredCount: number;

  @Column({ type: 'int', default: 0 })
  openedCount: number;

  @Column({ type: 'int', default: 0 })
  clickedCount: number;

  @Column({ type: 'int', default: 0 })
  unsubscribedCount: number;

  @Column({ type: 'int', default: 0 })
  bouncedCount: number;

  @Column({ type: 'int', default: 0 })
  failedCount: number;

  // Execution tracking
  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'json', nullable: true })
  executionLog?: Array<{
    timestamp: Date;
    action: string;
    details?: any;
    error?: string;
  }>;

  // A/B Testing
  @Column({ type: 'json', nullable: true })
  abTestConfig?: {
    enabled: boolean;
    variants: Array<{
      id: string;
      name: string;
      percentage: number;
      subject?: string;
      content?: string;
      htmlContent?: string;
    }>;
    winnerCriteria: 'open_rate' | 'click_rate' | 'conversion_rate';
    testDuration: number; // in hours
  };

  // Legacy field for backward compatibility
  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;
}
