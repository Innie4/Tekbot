import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { TwilioService } from '../messaging/twilio.service';
import { SlackService } from './slack.service';
import { ErrorHandlerUtil, ErrorContext } from '../../common/utils/error-handler.util';

export interface EmailNotificationOptions {
  to: string;
  subject: string;
  html: string;
  cc?: string[];
  bcc?: string[];
  attachments?: any[];
}

export interface SmsNotificationOptions {
  to: string;
  body: string;
  mediaUrl?: string[];
}

export interface SlackNotificationOptions {
  channel: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
}

export interface InAppNotificationOptions {
  userId?: string;
  tenantId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message_received' | 'appointment_reminder' | 'payment_confirmation';
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject(forwardRef(() => SmtpService)) private readonly smtpService: SmtpService,
    @Inject(forwardRef(() => TwilioService)) private readonly twilioService: TwilioService,
    @Inject(forwardRef(() => SlackService)) private readonly slackService: SlackService,
  ) {}

  async sendEmail(options: EmailNotificationOptions, context?: ErrorContext): Promise<boolean> {
    return ErrorHandlerUtil.handleAsync(
      async () => {
        const result = await this.smtpService.sendMail(
          options.to,
          options.subject,
          options.html
        );

        this.logger.log(`Email sent successfully to ${options.to}`, {
          context,
          to: options.to,
          subject: options.subject,
        });

        return result;
      },
      {
        service: 'NotificationService',
        method: 'sendEmail',
        metadata: { to: options.to, subject: options.subject },
        ...context,
      },
    );
  }

  async sendSms(options: SmsNotificationOptions, context?: ErrorContext): Promise<any> {
    return ErrorHandlerUtil.handleAsync(
      async () => {
        const result = await this.twilioService.sendSms({
          to: options.to,
          body: options.body,
          mediaUrl: options.mediaUrl,
        }, context);

        this.logger.log(`SMS sent successfully to ${options.to}`, {
          context,
          to: options.to,
          bodyLength: options.body.length,
        });

        return result;
      },
      {
        service: 'NotificationService',
        method: 'sendSms',
        metadata: { to: options.to },
        ...context,
      },
    );
  }

  async sendSlack(options: SlackNotificationOptions, context?: ErrorContext): Promise<any> {
    return ErrorHandlerUtil.handleAsync(
      async () => {
        const result = await this.slackService.sendMessage(
          options.channel,
          options.text
        );

        this.logger.log(`Slack message sent successfully to #${options.channel}`, {
          context,
          channel: options.channel,
          textLength: options.text.length,
        });

        return result;
      },
      {
        service: 'NotificationService',
        method: 'sendSlack',
        metadata: { channel: options.channel },
        ...context,
      },
    );
  }

  async sendInApp(options: InAppNotificationOptions, context?: ErrorContext): Promise<any> {
    return ErrorHandlerUtil.handleAsync(
      async () => {
        // TODO: Implement actual in-app notification storage and delivery
        // This would typically involve:
        // 1. Storing notification in database
        // 2. Sending via WebSocket to connected users
        // 3. Updating notification preferences
        
        const notification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: options.userId,
          tenantId: options.tenantId,
          title: options.title,
          message: options.message,
          type: options.type,
          priority: options.priority || 'medium',
          metadata: options.metadata || {},
          delivered: true,
          read: false,
          createdAt: new Date().toISOString(),
        };

        this.logger.log(`In-app notification created for tenant ${options.tenantId}`, {
          context,
          tenantId: options.tenantId,
          userId: options.userId,
          type: options.type,
          priority: options.priority,
        });

        return notification;
      },
      {
        service: 'NotificationService',
        method: 'sendInApp',
        metadata: { 
          tenantId: options.tenantId, 
          userId: options.userId, 
          type: options.type 
        },
        ...context,
      },
    );
  }

  // Convenience methods for common notification scenarios
  async sendPaymentConfirmation(tenantId: string, appointmentId: string, amount: number, context?: ErrorContext): Promise<void> {
    await this.sendInApp({
      tenantId,
      title: 'Payment Confirmed',
      message: `Payment of $${amount.toFixed(2)} has been confirmed for appointment ${appointmentId}`,
      type: 'payment_confirmation',
      priority: 'high',
      metadata: { appointmentId, amount },
    }, context);
  }

  async sendPaymentFailure(tenantId: string, appointmentId: string, context?: ErrorContext): Promise<void> {
    await this.sendInApp({
      tenantId,
      title: 'Payment Failed',
      message: `Payment failed for appointment ${appointmentId}. Please check payment details.`,
      type: 'error',
      priority: 'high',
      metadata: { appointmentId },
    }, context);
  }

  async sendAppointmentReminder(tenantId: string, appointmentId: string, customerName: string, appointmentTime: string, context?: ErrorContext): Promise<void> {
    await this.sendInApp({
      tenantId,
      title: 'Appointment Reminder',
      message: `Upcoming appointment with ${customerName} at ${appointmentTime}`,
      type: 'appointment_reminder',
      priority: 'medium',
      metadata: { appointmentId, customerName, appointmentTime },
    }, context);
  }

  async sendAdminAlert(title: string, message: string, context?: ErrorContext): Promise<void> {
    // Send to both Slack and in-app notifications for admin alerts
    await Promise.allSettled([
      this.sendSlack({
        channel: 'alerts',
        text: `🚨 ${title}: ${message}`,
      }, context),
      this.sendInApp({
        tenantId: 'system', // System-level notification
        title,
        message,
        type: 'error',
        priority: 'urgent',
      }, context),
    ]);
  }
}
