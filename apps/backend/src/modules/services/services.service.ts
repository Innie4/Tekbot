import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async findAllForTenant(tenantId: string) {
    return this.serviceRepository.find({ where: { tenantId } });
  }

  async createForTenant(tenantId: string, dto: Partial<Service>) {
    return this.serviceRepository.save({ ...dto, tenantId });
  }

  async findOneForTenant(tenantId: string, id: string) {
    return this.serviceRepository.findOne({ where: { tenantId, id } });
  }

  async updateForTenant(tenantId: string, id: string, dto: Partial<Service>) {
    await this.serviceRepository.update({ tenantId, id }, dto);
    return this.findOneForTenant(tenantId, id);
  }

  async removeForTenant(tenantId: string, id: string) {
    return this.serviceRepository.softDelete({ tenantId, id });
  }
}
