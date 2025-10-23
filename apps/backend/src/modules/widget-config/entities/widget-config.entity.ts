import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('widget_configs')
@Index(['tenantId'])
export class WidgetConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  tenant?: Tenant;

  @Column({ type: 'varchar', length: 255, default: 'Chat with us' })
  title: string;

  @Column({ type: 'text', nullable: true })
  welcomeMessage?: string;

  @Column({ type: 'text', nullable: true })
  placeholder?: string;

  @Column({ type: 'varchar', length: 20, default: 'bottom-right' })
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  @Column({ type: 'json', default: {} })
  theme: {
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

  @Column({ type: 'json', default: {} })
  branding: {
    logo?: string;
    companyName?: string;
    showPoweredBy?: boolean;
    customCSS?: string;
  };

  @Column({ type: 'json', default: {} })
  behavior: {
    autoOpen?: boolean;
    autoOpenDelay?: number;
    showOnPages?: string[];
    hideOnPages?: string[];
    enableSound?: boolean;
    enableTypingIndicator?: boolean;
    maxHeight?: string;
    maxWidth?: string;
  };

  @Column({ type: 'json', default: {} })
  security: {
    allowedDomains?: string[];
    requireAuth?: boolean;
    enableRateLimit?: boolean;
    rateLimitRequests?: number;
    rateLimitWindow?: number;
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 50, default: 'v1' })
  version: string;

  @Column({ type: 'json', nullable: true })
  customFields?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}