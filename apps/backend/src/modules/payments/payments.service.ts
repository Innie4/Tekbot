import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async findAllForTenant(tenantId: string) {
    return this.paymentRepository.find({ where: { tenantId } });
  }

  async createForTenant(tenantId: string, dto: Partial<Payment>) {
    return this.paymentRepository.save({ ...dto, tenantId });
  }

  async findOneForTenant(tenantId: string, id: string) {
    return this.paymentRepository.findOne({ where: { tenantId, id } });
  }

  async updateForTenant(tenantId: string, id: string, dto: Partial<Payment>) {
    await this.paymentRepository.update({ tenantId, id }, dto);
    return this.findOneForTenant(tenantId, id);
  }

  async removeForTenant(tenantId: string, id: string) {
    return this.paymentRepository.softDelete({ tenantId, id });
  }
}
