import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationService } from '../notifications/notification.service';
import { ReminderJobData } from './appointment-reminder.service';

@Processor('appointment-reminders')
export class AppointmentReminderProcessor {
  private readonly logger = new Logger(AppointmentReminderProcessor.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Process('send-reminder')
  async handleReminderJob(job: Job<ReminderJobData>): Promise<void> {
    const {
      appointmentId,
      tenantId,
      customerId,
      customerEmail,
      customerPhone,
      customerName,
      appointmentTime,
      serviceName,
      staffName,
      reminderType,
      reminderMinutes,
    } = job.data;

    try {
      this.logger.log(`Processing reminder for appointment ${appointmentId} (${reminderMinutes} minutes before)`);

      const appointmentDateTime = new Date(appointmentTime);
      const formattedDate = appointmentDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const formattedTime = appointmentDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Prepare notification content
      const reminderTitle = this.getReminderTitle(reminderMinutes);
      const reminderMessage = this.getReminderMessage({
        customerName,
        serviceName,
        staffName,
        formattedDate,
        formattedTime,
        reminderMinutes,
      });

      // Send email reminder
      if ((reminderType === 'email' || reminderType === 'both') && customerEmail) {
        await this.sendEmailReminder({
          tenantId,
          appointmentId,
          customerEmail,
          customerName,
          reminderTitle,
          reminderMessage,
          serviceName,
          staffName,
          formattedDate,
          formattedTime,
          reminderMinutes,
        });
      }

      // Send SMS reminder
      if ((reminderType === 'sms' || reminderType === 'both') && customerPhone) {
        await this.sendSmsReminder({
          tenantId,
          appointmentId,
          customerPhone,
          customerName,
          reminderMessage,
          serviceName,
          formattedDate,
          formattedTime,
        });
      }

      // Send in-app notification
      await this.notificationService.sendAppointmentReminder(
        tenantId,
        appointmentId,
        customerName,
        `${formattedDate} at ${formattedTime}`,
      );

      this.logger.log(`Successfully sent reminder for appointment ${appointmentId}`);
    } catch (error) {
      this.logger.error(`Error processing reminder for appointment ${appointmentId}:`, error);
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  private async sendEmailReminder(params: {
    tenantId: string;
    appointmentId: string;
    customerEmail: string;
    customerName: string;
    reminderTitle: string;
    reminderMessage: string;
    serviceName: string;
    staffName?: string;
    formattedDate: string;
    formattedTime: string;
    reminderMinutes: number;
  }): Promise<void> {
    try {
      const emailSubject = `${params.reminderTitle} - ${params.serviceName}`;
      const emailHtml = this.generateEmailTemplate(params);

      await this.notificationService.sendEmail({
        tenantId: params.tenantId,
        to: params.customerEmail,
        subject: emailSubject,
        html: emailHtml,
        template: 'appointment-reminder',
        templateData: {
          customerName: params.customerName,
          serviceName: params.serviceName,
          staffName: params.staffName,
          appointmentDate: params.formattedDate,
          appointmentTime: params.formattedTime,
          reminderMinutes: params.reminderMinutes,
          appointmentId: params.appointmentId,
        },
      });

      this.logger.log(`Email reminder sent to ${params.customerEmail} for appointment ${params.appointmentId}`);
    } catch (error) {
      this.logger.error(`Error sending email reminder for appointment ${params.appointmentId}:`, error);
      throw error;
    }
  }

  private async sendSmsReminder(params: {
    tenantId: string;
    appointmentId: string;
    customerPhone: string;
    customerName: string;
    reminderMessage: string;
    serviceName: string;
    formattedDate: string;
    formattedTime: string;
  }): Promise<void> {
    try {
      const smsMessage = `Hi ${params.customerName}! Reminder: You have a ${params.serviceName} appointment on ${params.formattedDate} at ${params.formattedTime}. See you soon!`;

      await this.notificationService.sendSms({
        tenantId: params.tenantId,
        to: params.customerPhone,
        message: smsMessage,
        metadata: {
          appointmentId: params.appointmentId,
          type: 'appointment_reminder',
        },
      });

      this.logger.log(`SMS reminder sent to ${params.customerPhone} for appointment ${params.appointmentId}`);
    } catch (error) {
      this.logger.error(`Error sending SMS reminder for appointment ${params.appointmentId}:`, error);
      throw error;
    }
  }

  private getReminderTitle(reminderMinutes: number): string {
    if (reminderMinutes === 0) {
      return 'Appointment Starting Soon';
    } else if (reminderMinutes < 60) {
      return `Appointment in ${reminderMinutes} minutes`;
    } else if (reminderMinutes < 1440) {
      const hours = Math.floor(reminderMinutes / 60);
      return `Appointment in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(reminderMinutes / 1440);
      return `Appointment in ${days} day${days > 1 ? 's' : ''}`;
    }
  }

  private getReminderMessage(params: {
    customerName: string;
    serviceName: string;
    staffName?: string;
    formattedDate: string;
    formattedTime: string;
    reminderMinutes: number;
  }): string {
    const timePhrase = this.getReminderTitle(params.reminderMinutes).toLowerCase();
    const staffInfo = params.staffName ? ` with ${params.staffName}` : '';
    
    return `Hi ${params.customerName}! This is a reminder that you have a ${params.serviceName} appointment${staffInfo} ${timePhrase} on ${params.formattedDate} at ${params.formattedTime}.`;
  }

  private generateEmailTemplate(params: {
    customerName: string;
    reminderTitle: string;
    reminderMessage: string;
    serviceName: string;
    staffName?: string;
    formattedDate: string;
    formattedTime: string;
    appointmentId: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${params.reminderTitle}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .appointment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #6b7280; }
        .value { color: #111827; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${params.reminderTitle}</h1>
        </div>
        <div class="content">
            <p>Dear ${params.customerName},</p>
            <p>${params.reminderMessage}</p>
            
            <div class="appointment-details">
                <h3>Appointment Details</h3>
                <div class="detail-row">
                    <span class="label">Service:</span>
                    <span class="value">${params.serviceName}</span>
                </div>
                ${params.staffName ? `
                <div class="detail-row">
                    <span class="label">Staff:</span>
                    <span class="value">${params.staffName}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="label">Date:</span>
                    <span class="value">${params.formattedDate}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Time:</span>
                    <span class="value">${params.formattedTime}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Appointment ID:</span>
                    <span class="value">${params.appointmentId}</span>
                </div>
            </div>
            
            <p>If you need to reschedule or cancel your appointment, please contact us as soon as possible.</p>
            
            <p>We look forward to seeing you!</p>
            
            <div class="footer">
                <p>This is an automated reminder. Please do not reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }
}