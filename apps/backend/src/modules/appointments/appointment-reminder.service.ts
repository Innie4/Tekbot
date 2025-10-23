import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Queue } from 'bull';
import { ConfigType, ConfigService } from '@nestjs/config';
import { Appointment } from './entities/appointment.entity';
import { NotificationService } from '../notifications/notification.service';
import { reminderConfig } from './config';

export interface ReminderJobData {
  appointmentId: string;
  tenantId: string;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName: string;
  appointmentTime: Date;
  serviceName: string;
  staffName?: string;
  reminderType: 'email' | 'sms' | 'both';
  reminderMinutes: number;
}

@Injectable()
export class AppointmentReminderService {
  private readonly logger = new Logger(AppointmentReminderService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectQueue('appointment-reminders')
    private readonly reminderQueue: Queue,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Cron job that runs every 5 minutes to check for appointments needing reminders
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduleUpcomingReminders(): Promise<void> {
    try {
      this.logger.log('Checking for appointments needing reminders...');

      const reminderIntervals = this.getReminderIntervals();

      for (const interval of reminderIntervals) {
        await this.scheduleRemindersForInterval(interval);
      }

      this.logger.log('Reminder scheduling completed');
    } catch (error) {
      this.logger.error('Error scheduling reminders:', error);
    }
  }

  /**
   * Schedule reminders for a specific time interval
   */
  private async scheduleRemindersForInterval(
    reminderMinutes: number,
  ): Promise<void> {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + reminderMinutes * 60 * 1000);
    const windowStart = new Date(reminderTime.getTime() - 2.5 * 60 * 1000); // 2.5 minutes before
    const windowEnd = new Date(reminderTime.getTime() + 2.5 * 60 * 1000); // 2.5 minutes after

    const appointments = await this.appointmentRepository.find({
      where: {
        start_time: MoreThan(windowStart) && LessThan(windowEnd),
        status: 'scheduled', // Only send reminders for scheduled appointments
      },
      relations: ['customer', 'service', 'staff'],
    });

    this.logger.log(
      `Found ${appointments.length} appointments for ${reminderMinutes}-minute reminders`,
    );

    for (const appointment of appointments) {
      await this.scheduleReminderJob(appointment, reminderMinutes);
    }
  }

  /**
   * Schedule a reminder job for a specific appointment
   */
  async scheduleReminderJob(
    appointment: Appointment,
    reminderMinutes: number,
  ): Promise<void> {
    try {
      // Check if reminder already scheduled for this appointment and interval
      const existingJobs = await this.reminderQueue.getJobs([
        'delayed',
        'waiting',
      ]);
      const jobExists = existingJobs.some(
        job =>
          job.data.appointmentId === appointment.id &&
          job.data.reminderMinutes === reminderMinutes,
      );

      if (jobExists) {
        this.logger.debug(
          `Reminder already scheduled for appointment ${appointment.id} at ${reminderMinutes} minutes`,
        );
        return;
      }

      const reminderJobData: ReminderJobData = {
        appointmentId: appointment.id,
        tenantId: appointment.tenantId,
        customerId: appointment.customerId,
        customerEmail: appointment.customer?.email,
        customerPhone: appointment.customer?.phone,
        customerName: appointment.customer?.name || 'Customer',
        appointmentTime: appointment.start_time,
        serviceName: appointment.service?.name || 'Service',
        staffName: appointment.staff?.name,
        reminderType: this.getReminderType(appointment.tenantId),
        reminderMinutes,
      };

      // Calculate delay until reminder should be sent
      const reminderTime = new Date(
        appointment.start_time.getTime() - reminderMinutes * 60 * 1000,
      );
      const delay = Math.max(0, reminderTime.getTime() - Date.now());

      await this.reminderQueue.add('send-reminder', reminderJobData, {
        delay,
        jobId: `${appointment.id}-${reminderMinutes}min`,
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log(
        `Scheduled ${reminderMinutes}-minute reminder for appointment ${appointment.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error scheduling reminder for appointment ${appointment.id}:`,
        error,
      );
    }
  }

  /**
   * Cancel all reminders for an appointment (when appointment is cancelled/rescheduled)
   */
  async cancelReminders(appointmentId: string): Promise<void> {
    try {
      const jobs = await this.reminderQueue.getJobs(['delayed', 'waiting']);
      const appointmentJobs = jobs.filter(
        job => job.data.appointmentId === appointmentId,
      );

      for (const job of appointmentJobs) {
        await job.remove();
      }

      this.logger.log(
        `Cancelled ${appointmentJobs.length} reminders for appointment ${appointmentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error cancelling reminders for appointment ${appointmentId}:`,
        error,
      );
    }
  }

  /**
   * Reschedule reminders for an appointment (when appointment time changes)
   */
  async rescheduleReminders(appointmentId: string): Promise<void> {
    try {
      // Cancel existing reminders
      await this.cancelReminders(appointmentId);

      // Get updated appointment
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['customer', 'service', 'staff'],
      });

      if (!appointment || appointment.status !== 'scheduled') {
        return;
      }

      // Schedule new reminders
      const reminderIntervals = this.getReminderIntervals();
      for (const interval of reminderIntervals) {
        await this.scheduleReminderJob(appointment, interval);
      }

      this.logger.log(`Rescheduled reminders for appointment ${appointmentId}`);
    } catch (error) {
      this.logger.error(
        `Error rescheduling reminders for appointment ${appointmentId}:`,
        error,
      );
    }
  }

  /**
   * Send immediate reminder for an appointment
   */
  async sendImmediateReminder(
    appointmentId: string,
    reminderType: 'email' | 'sms' | 'both' = 'both',
  ): Promise<void> {
    try {
      const appointment = await this.appointmentRepository.findOne({
        where: { id: appointmentId },
        relations: ['customer', 'service', 'staff'],
      });

      if (!appointment) {
        throw new Error(`Appointment ${appointmentId} not found`);
      }

      const reminderJobData: ReminderJobData = {
        appointmentId: appointment.id,
        tenantId: appointment.tenantId,
        customerId: appointment.customerId,
        customerEmail: appointment.customer?.email,
        customerPhone: appointment.customer?.phone,
        customerName: appointment.customer?.name || 'Customer',
        appointmentTime: appointment.start_time,
        serviceName: appointment.service?.name || 'Service',
        staffName: appointment.staff?.name,
        reminderType,
        reminderMinutes: 0,
      };

      await this.reminderQueue.add('send-reminder', reminderJobData, {
        priority: 10, // High priority for immediate reminders
        removeOnComplete: 5,
        removeOnFail: 3,
      });

      this.logger.log(
        `Queued immediate reminder for appointment ${appointmentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending immediate reminder for appointment ${appointmentId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get reminder intervals from configuration
   */
  private getReminderIntervals(): number[] {
    const defaultIntervals = [1440, 60, 15]; // 24 hours, 1 hour, 15 minutes
    const configIntervals = this.configService.get<string>(
      'APPOINTMENT_REMINDER_INTERVALS',
    );

    if (configIntervals) {
      return configIntervals
        .split(',')
        .map(interval => parseInt(interval.trim(), 10));
    }

    return defaultIntervals;
  }

  /**
   * Get reminder type preference for tenant
   */
  private getReminderType(tenantId: string): 'email' | 'sms' | 'both' {
    // This could be enhanced to check tenant preferences from database
    const emailEnabled = this.configService.get<boolean>(
      'APPOINTMENT_EMAIL_REMINDERS_ENABLED',
      true,
    );
    const smsEnabled = this.configService.get<boolean>(
      'APPOINTMENT_SMS_REMINDERS_ENABLED',
      false,
    );

    if (emailEnabled && smsEnabled) return 'both';
    if (smsEnabled) return 'sms';
    return 'email';
  }

  /**
   * Get statistics about scheduled reminders
   */
  async getReminderStats(): Promise<{
    totalScheduled: number;
    byInterval: Record<string, number>;
    failed: number;
    completed: number;
  }> {
    try {
      const [waiting, delayed, completed, failed] = await Promise.all([
        this.reminderQueue.getJobs(['waiting']),
        this.reminderQueue.getJobs(['delayed']),
        this.reminderQueue.getJobs(['completed'], 0, 100),
        this.reminderQueue.getJobs(['failed'], 0, 100),
      ]);

      const allScheduled = [...waiting, ...delayed];
      const byInterval: Record<string, number> = {};

      allScheduled.forEach(job => {
        const interval = `${job.data.reminderMinutes}min`;
        byInterval[interval] = (byInterval[interval] || 0) + 1;
      });

      return {
        totalScheduled: allScheduled.length,
        byInterval,
        failed: failed.length,
        completed: completed.length,
      };
    } catch (error) {
      this.logger.error('Error getting reminder stats:', error);
      return {
        totalScheduled: 0,
        byInterval: {},
        failed: 0,
        completed: 0,
      };
    }
  }
}
