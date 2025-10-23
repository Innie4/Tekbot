import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { Conversation } from '../../conversations/entities/conversation.entity';

@Entity('messages')
@Index(['tenantId'])
@Index(['conversationId'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column()
  conversationId: string;

  @ManyToOne(() => Conversation, conversation => conversation.messages, {
    onDelete: 'CASCADE',
  })
  conversation: Conversation;

  @Column({ nullable: true })
  customerId?: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE', nullable: true })
  customer?: Customer;

  @Column({ type: 'varchar', length: 50 })
  channel: string;

  @Column({ type: 'varchar', length: 20 })
  direction: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
