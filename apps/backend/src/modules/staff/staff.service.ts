import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from './entities/staff.entity';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepository: Repository<Staff>,
  ) {}

  async findAllForTenant(tenantId: string) {
    return this.staffRepository.find({ where: { tenantId } });
  }

  async createForTenant(tenantId: string, dto: Partial<Staff>) {
    return this.staffRepository.save({ ...dto, tenantId });
  }

  async findOneForTenant(tenantId: string, id: string) {
    return this.staffRepository.findOne({ where: { tenantId, id } });
  }

  async updateForTenant(tenantId: string, id: string, dto: Partial<Staff>) {
    await this.staffRepository.update({ tenantId, id }, dto);
    return this.findOneForTenant(tenantId, id);
  }

  async removeForTenant(tenantId: string, id: string) {
    return this.staffRepository.softDelete({ tenantId, id });
  }
}
