import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

export enum TenantPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Entity('tenants')
@Index(['subdomain'], { unique: true })
@Index(['domain'], { unique: true })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  subdomain: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  domain?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone?: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.TRIAL,
  })
  status: TenantStatus;

  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.FREE,
  })
  plan: TenantPlan;

  @Column({ type: 'json', nullable: true })
  settings?: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  features?: string[];

  @Column({ type: 'json', nullable: true })
  limits?: Record<string, number>;

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  subscriptionEndsAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeCustomerId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripeSubscriptionId?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual properties
  get isActive(): boolean {
    return this.status === TenantStatus.ACTIVE;
  }

  get isOnTrial(): boolean {
    return this.status === TenantStatus.TRIAL && this.trialEndsAt && this.trialEndsAt > new Date();
  }

  get hasActiveSubscription(): boolean {
    return this.subscriptionEndsAt && this.subscriptionEndsAt > new Date();
  }

  get fullDomain(): string {
    return this.domain || `${this.subdomain}.tekassist.com`;
  }
}