import { registerAs } from '@nestjs/config';

export interface ReminderConfig {
  enabled: boolean;
  defaultIntervals: number[]; // in minutes
  email: {
    enabled: boolean;
    template: string;
    fromName: string;
    fromEmail: string;
  };
  sms: {
    enabled: boolean;
    template: string;
  };
  inApp: {
    enabled: boolean;
    template: string;
  };
  queue: {
    attempts: number;
    backoff: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete: number;
    removeOnFail: number;
  };
  businessHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
    timezone: string;
  };
}

export default registerAs(
  'reminder',
  (): ReminderConfig => ({
    enabled: process.env.APPOINTMENT_REMINDERS_ENABLED === 'true',
    defaultIntervals: [
      parseInt(process.env.REMINDER_INTERVAL_24H || '1440', 10), // 24 hours
      parseInt(process.env.REMINDER_INTERVAL_1H || '60', 10), // 1 hour
      parseInt(process.env.REMINDER_INTERVAL_15M || '15', 10), // 15 minutes
    ],
    email: {
      enabled: process.env.EMAIL_REMINDERS_ENABLED === 'true',
      template: process.env.EMAIL_REMINDER_TEMPLATE || 'appointment-reminder',
      fromName: process.env.EMAIL_FROM_NAME || 'TekAssist',
      fromEmail: process.env.EMAIL_FROM_ADDRESS || 'noreply@tekassist.com',
    },
    sms: {
      enabled: process.env.SMS_REMINDERS_ENABLED === 'true',
      template: process.env.SMS_REMINDER_TEMPLATE || 'appointment-reminder-sms',
    },
    inApp: {
      enabled: process.env.IN_APP_REMINDERS_ENABLED !== 'false', // default true
      template:
        process.env.IN_APP_REMINDER_TEMPLATE ||
        'appointment-reminder-notification',
    },
    queue: {
      attempts: parseInt(process.env.REMINDER_QUEUE_ATTEMPTS || '3', 10),
      backoff: {
        type:
          (process.env.REMINDER_QUEUE_BACKOFF_TYPE as
            | 'exponential'
            | 'fixed') || 'exponential',
        delay: parseInt(process.env.REMINDER_QUEUE_BACKOFF_DELAY || '2000', 10),
      },
      removeOnComplete: parseInt(
        process.env.REMINDER_QUEUE_REMOVE_COMPLETE || '100',
        10,
      ),
      removeOnFail: parseInt(
        process.env.REMINDER_QUEUE_REMOVE_FAIL || '50',
        10,
      ),
    },
    businessHours: {
      enabled: process.env.BUSINESS_HOURS_ONLY === 'true',
      start: process.env.BUSINESS_HOURS_START || '09:00',
      end: process.env.BUSINESS_HOURS_END || '18:00',
      timezone: process.env.BUSINESS_TIMEZONE || 'UTC',
    },
  }),
);
