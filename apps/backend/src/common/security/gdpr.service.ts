import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Consent } from './entities/consent.entity';

@Injectable()
export class GdprService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Consent)
    private readonly consentRepository: Repository<Consent>,
  ) {}

  async exportData(userId: string) {
    // Export user data for GDPR
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    // Exclude sensitive fields
    const { password, ...exported } = user;
    return exported;
  }

  async deleteData(userId: string) {
    // Delete user data for GDPR
    await this.userRepository.delete(userId);
    return { userId, deleted: true };
  }

  async recordConsent(userId: string, consent: boolean) {
    const record = this.consentRepository.create({ userId, consent });
    await this.consentRepository.save(record);
    return record;
  }
}
