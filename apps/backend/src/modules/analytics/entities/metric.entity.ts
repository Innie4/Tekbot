import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('metrics')
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  type: string; // 'bot_accuracy', 'conversion', 'engagement'

  @Column('float')
  value: number;

  @CreateDateColumn()
  createdAt: Date;
}
