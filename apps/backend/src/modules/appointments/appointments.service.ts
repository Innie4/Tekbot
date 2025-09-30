import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Appointment } from './entities/appointment.entity';
import { AppointmentReminderService } from './appointment-reminder.service';

export interface CreateAppointmentDto {
  customerId: string;
  staffId: string;
  serviceId: string;
  start_time: Date;
  end_time: Date;
  status?: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  customerId?: string;
  staffId?: string;
  serviceId?: string;
  start_time?: Date;
  end_time?: Date;
  status?: string;
  notes?: string;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly reminderService: AppointmentReminderService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAllForTenant(tenantId: string, includeRelations = false) {
    const relations = includeRelations ? ['customer', 'service', 'staff'] : [];
    return this.appointmentRepository.find({ 
      where: { tenantId },
      relations,
      order: { start_time: 'ASC' }
    });
  }

  async createForTenant(tenantId: string, dto: CreateAppointmentDto) {
    try {
      const appointment = await this.appointmentRepository.save({ 
        ...dto, 
        tenantId,
        status: dto.status || 'scheduled'
      });

      // Schedule reminders for new appointment
      if (appointment.status === 'scheduled') {
        await this.scheduleReminders(appointment.id);
      }

      // Emit appointment created event
      this.eventEmitter.emit('appointment.created', {
        appointmentId: appointment.id,
        tenantId,
        customerId: dto.customerId,
        start_time: dto.start_time,
      });

      this.logger.log(`Created appointment ${appointment.id} for tenant ${tenantId}`);
      return appointment;
    } catch (error) {
      this.logger.error(`Error creating appointment for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async findOneForTenant(tenantId: string, id: string, includeRelations = false) {
    const relations = includeRelations ? ['customer', 'service', 'staff'] : [];
    return this.appointmentRepository.findOne({ 
      where: { tenantId, id },
      relations
    });
  }

  async updateForTenant(tenantId: string, id: string, dto: UpdateAppointmentDto) {
    try {
      const existingAppointment = await this.findOneForTenant(tenantId, id);
      if (!existingAppointment) {
        throw new Error(`Appointment ${id} not found`);
      }

      const wasScheduled = existingAppointment.status === 'scheduled';
      const timeChanged = dto.start_time && dto.start_time.getTime() !== existingAppointment.start_time.getTime();
      const statusChanged = dto.status && dto.status !== existingAppointment.status;

      await this.appointmentRepository.update({ tenantId, id }, dto);
      const updatedAppointment = await this.findOneForTenant(tenantId, id);

      // Handle reminder scheduling based on changes
      if (statusChanged) {
        if (dto.status === 'cancelled' || dto.status === 'completed') {
          // Cancel reminders for cancelled/completed appointments
          await this.reminderService.cancelReminders(id);
        } else if (dto.status === 'scheduled' && !wasScheduled) {
          // Schedule reminders for newly scheduled appointments
          await this.scheduleReminders(id);
        }
      }

      if (timeChanged && updatedAppointment.status === 'scheduled') {
        // Reschedule reminders when time changes
        await this.reminderService.rescheduleReminders(id);
      }

      // Emit appropriate events
      if (statusChanged) {
        this.eventEmitter.emit(`appointment.${dto.status}`, {
          appointmentId: id,
          tenantId,
          previousStatus: existingAppointment.status,
          newStatus: dto.status,
        });
      }

      if (timeChanged) {
        this.eventEmitter.emit('appointment.rescheduled', {
          appointmentId: id,
          tenantId,
          oldTime: existingAppointment.start_time,
          newTime: dto.start_time,
        });
      }

      this.logger.log(`Updated appointment ${id} for tenant ${tenantId}`);
      return updatedAppointment;
    } catch (error) {
      this.logger.error(`Error updating appointment ${id} for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async removeForTenant(tenantId: string, id: string) {
    try {
      // Cancel reminders before removing appointment
      await this.reminderService.cancelReminders(id);

      const result = await this.appointmentRepository.softDelete({ tenantId, id });

      // Emit appointment cancelled event
      this.eventEmitter.emit('appointment.cancelled', {
        appointmentId: id,
        tenantId,
      });

      this.logger.log(`Removed appointment ${id} for tenant ${tenantId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error removing appointment ${id} for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments for a tenant
   */
  async getUpcomingAppointments(tenantId: string, days = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.appointmentRepository.find({
      where: {
        tenantId,
        start_time: MoreThan(startDate),
        status: 'scheduled',
      },
      relations: ['customer', 'service', 'staff'],
      order: { start_time: 'ASC' },
    });
  }

  /**
   * Schedule reminders for an appointment
   */
  async scheduleReminders(appointmentId: string): Promise<void> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['customer', 'service', 'staff'],
      });

      if (!appointment || appointment.status !== 'scheduled') {
        return;
      }

      // Only schedule reminders for future appointments
      if (appointment.start_time <= new Date()) {
        return;
      }

      const reminderIntervals = [1440, 60, 15]; // 24 hours, 1 hour, 15 minutes
      
      for (const interval of reminderIntervals) {
        await this.reminderService.scheduleReminderJob(appointment, interval);
      }

      this.logger.log(`Scheduled reminders for appointment ${appointmentId}`);
    } catch (error) {
      this.logger.error(`Error scheduling reminders for appointment ${appointmentId}:`, error);
    }
  }

  /**
   * Send immediate reminder for an appointment
   */
  async sendImmediateReminder(tenantId: string, appointmentId: string, reminderType: 'email' | 'sms' | 'both' = 'both'): Promise<void> {
    const appointment = await this.findOneForTenant(tenantId, appointmentId);
    if (!appointment) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    return this.reminderService.sendImmediateReminder(appointmentId, reminderType);
  }

  /**
   * Get appointment statistics for a tenant
   */
  async getAppointmentStats(tenantId: string) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [total, scheduled, completed, cancelled, todayCount] = await Promise.all([
      this.appointmentRepository.count({ where: { tenantId } }),
      this.appointmentRepository.count({ where: { tenantId, status: 'scheduled' } }),
      this.appointmentRepository.count({ where: { tenantId, status: 'completed' } }),
      this.appointmentRepository.count({ where: { tenantId, status: 'cancelled' } }),
      this.appointmentRepository.count({
        where: {
          tenantId,
          start_time: MoreThan(startOfDay) && MoreThan(endOfDay),
        },
      }),
    ]);

    return {
      total,
      scheduled,
      completed,
      cancelled,
      todayCount,
    };
  }
}
