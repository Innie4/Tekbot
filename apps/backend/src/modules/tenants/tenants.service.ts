import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from './entities/tenant.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      relations: ['users'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { subdomain },
      relations: ['users'],
    });
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { domain },
      relations: ['users'],
    });
  }

  async create(tenantData: Partial<Tenant>): Promise<Tenant> {
    // Check if subdomain already exists
    if (tenantData.subdomain) {
      const existingTenant = await this.findBySubdomain(tenantData.subdomain);
      if (existingTenant) {
        throw new ConflictException(
          'Tenant with this subdomain already exists',
        );
      }
    }

    // Check if domain already exists
    if (tenantData.domain) {
      const existingTenant = await this.findByDomain(tenantData.domain);
      if (existingTenant) {
        throw new ConflictException('Tenant with this domain already exists');
      }
    }

    const tenant = this.tenantRepository.create({
      ...tenantData,
      status: TenantStatus.TRIAL,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
    });

    return this.tenantRepository.save(tenant);
  }

  async update(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findOne(id);

    // Check subdomain uniqueness if being updated
    if (updateData.subdomain && updateData.subdomain !== tenant.subdomain) {
      const existingTenant = await this.findBySubdomain(updateData.subdomain);
      if (existingTenant) {
        throw new ConflictException(
          'Tenant with this subdomain already exists',
        );
      }
    }

    // Check domain uniqueness if being updated
    if (updateData.domain && updateData.domain !== tenant.domain) {
      const existingTenant = await this.findByDomain(updateData.domain);
      if (existingTenant) {
        throw new ConflictException('Tenant with this domain already exists');
      }
    }

    await this.tenantRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    await this.tenantRepository.remove(tenant);
  }

  async activate(id: string): Promise<Tenant> {
    await this.tenantRepository.update(id, {
      status: TenantStatus.ACTIVE,
    });
    return this.findOne(id);
  }

  async suspend(id: string): Promise<Tenant> {
    await this.tenantRepository.update(id, {
      status: TenantStatus.SUSPENDED,
    });
    return this.findOne(id);
  }

  async updateSettings(
    id: string,
    settings: Record<string, any>,
  ): Promise<Tenant> {
    const tenant = await this.findOne(id);
    const updatedSettings = { ...tenant.settings, ...settings };

    await this.tenantRepository.update(id, {
      settings: updatedSettings,
    });

    return this.findOne(id);
  }

  async updateFeatures(id: string, features: string[]): Promise<Tenant> {
    await this.tenantRepository.update(id, {
      features,
    });
    return this.findOne(id);
  }

  async updateLimits(
    id: string,
    limits: Record<string, number>,
  ): Promise<Tenant> {
    const tenant = await this.findOne(id);
    const updatedLimits = { ...tenant.limits, ...limits };

    await this.tenantRepository.update(id, {
      limits: updatedLimits,
    });

    return this.findOne(id);
  }

  async getActiveTenantsCount(): Promise<number> {
    return this.tenantRepository.count({
      where: { status: TenantStatus.ACTIVE },
    });
  }

  async getTrialTenantsCount(): Promise<number> {
    return this.tenantRepository.count({
      where: { status: TenantStatus.TRIAL },
    });
  }
}
