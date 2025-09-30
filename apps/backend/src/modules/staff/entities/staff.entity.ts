import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, Index } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Service } from '../../services/entities/service.entity';

@Entity('staff')
@Index(['tenantId'])
export class Staff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @ManyToMany(() => Service)
  @JoinTable()
  services: Service[];

  @Column({ type: 'json', nullable: true })
  availability_schedule?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
