import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { emailVerificationToken: token },
      relations: ['tenant'],
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['tenant'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        tenantId: true,
        lastLoginAt: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['tenant'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        tenantId: true,
        lastLoginAt: true,
        emailVerifiedAt: true,
        preferences: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['tenant'],
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['tenant'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        phone: true,
        avatar: true,
        role: true,
        status: true,
        tenantId: true,
        lastLoginAt: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password if provided
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }

    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    // Return user without password
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);

    // Hash password if being updated
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    // Check email uniqueness if being updated
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date(),
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userRepository.update(id, {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
      status: UserStatus.ACTIVE,
    });
  }

  async setPasswordResetToken(
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepository.update(
      { email },
      {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: token,
      },
    });

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new NotFoundException('Invalid or expired password reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
