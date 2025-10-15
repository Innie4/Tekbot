import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentReminderService } from './appointment-reminder.service';
import { AppointmentReminderProcessor } from './appointment-reminder.processor';
import { Appointment } from './entities/appointment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { reminderConfig } from './config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    BullModule.registerQueue({
      name: 'appointment-reminders',
    }),
    ConfigModule.forFeature(reminderConfig),
    NotificationsModule,
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentReminderService,
    AppointmentReminderProcessor,
  ],
  exports: [AppointmentsService, AppointmentReminderService],
})
export class AppointmentsModule {}