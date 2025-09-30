import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>
  ) {}

  async findAllForTenant(tenantId: string) {
    return this.leadRepository.find({ where: { tenantId } });
  }

  async createForTenant(tenantId: string, dto: Partial<Lead>) {
    return this.leadRepository.save({ ...dto, tenantId });
  }

  async findOneForTenant(tenantId: string, id: string) {
    return this.leadRepository.findOne({ where: { tenantId, id } });
  }

  async updateForTenant(tenantId: string, id: string, dto: Partial<Lead>) {
    await this.leadRepository.update({ tenantId, id }, dto);
    return this.findOneForTenant(tenantId, id);
  }

  async removeForTenant(tenantId: string, id: string) {
    return this.leadRepository.softDelete({ tenantId, id });
  }
}
