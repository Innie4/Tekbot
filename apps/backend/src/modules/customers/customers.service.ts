import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async findAllForTenant(tenantId: string) {
    return this.customerRepository.find({ where: { tenantId } });
  }

  async createForTenant(tenantId: string, dto: Partial<Customer>) {
    return this.customerRepository.save({ ...dto, tenantId });
  }

  async findOneForTenant(tenantId: string, id: string) {
    return this.customerRepository.findOne({ where: { tenantId, id } });
  }

  async updateForTenant(tenantId: string, id: string, dto: Partial<Customer>) {
    await this.customerRepository.update({ tenantId, id }, dto);
    return this.findOneForTenant(tenantId, id);
  }

  async removeForTenant(tenantId: string, id: string) {
    return this.customerRepository.softDelete({ tenantId, id });
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { phone },
      relations: ['tenant'],
    });
  }

  async create(customerData: Partial<Customer>): Promise<Customer> {
    const customer = this.customerRepository.create(customerData);
    return this.customerRepository.save(customer);
  }
}
