import { registerAs } from '@nestjs/config';

export const emailConfig = registerAs('email', () => ({
  // SMTP configuration
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
    pool: process.env.SMTP_POOL === 'true',
    maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS, 10) || 5,
    maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES, 10) || 100,
    rateDelta: parseInt(process.env.SMTP_RATE_DELTA, 10) || 1000,
    rateLimit: parseInt(process.env.SMTP_RATE_LIMIT, 10) || 5,
  },
  
  // Default sender information
  from: {
    name: process.env.EMAIL_FROM_NAME || 'TekBot Platform',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@tekbot.com',
  },
  
  // Reply-to configuration
  replyTo: {
    name: process.env.EMAIL_REPLY_TO_NAME || 'TekBot Support',
    address: process.env.EMAIL_REPLY_TO_ADDRESS || 'support@tekbot.com',
  },
  
  // Email templates
  templates: {
    baseUrl: process.env.EMAIL_TEMPLATE_BASE_URL || 'https://app.tekbot.com',
    logoUrl: process.env.EMAIL_LOGO_URL || 'https://app.tekbot.com/logo.png',
    unsubscribeUrl: process.env.EMAIL_UNSUBSCRIBE_URL || 'https://app.tekbot.com/unsubscribe',
    privacyPolicyUrl: process.env.EMAIL_PRIVACY_POLICY_URL || 'https://app.tekbot.com/privacy',
    termsOfServiceUrl: process.env.EMAIL_TERMS_URL || 'https://app.tekbot.com/terms',
    supportUrl: process.env.EMAIL_SUPPORT_URL || 'https://app.tekbot.com/support',
    
    // Template engine
    engine: process.env.EMAIL_TEMPLATE_ENGINE || 'handlebars', // 'handlebars', 'ejs', 'pug'
    directory: process.env.EMAIL_TEMPLATE_DIRECTORY || './templates/email',
    
    // Template types
    types: {
      welcome: {
        subject: process.env.EMAIL_WELCOME_SUBJECT || 'Welcome to TekBot Platform!',
        template: 'welcome',
      },
      verification: {
        subject: process.env.EMAIL_VERIFICATION_SUBJECT || 'Verify your email address',
        template: 'email-verification',
        expiryHours: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY_HOURS, 10) || 24,
      },
      passwordReset: {
        subject: process.env.EMAIL_PASSWORD_RESET_SUBJECT || 'Reset your password',
        template: 'password-reset',
        expiryHours: parseInt(process.env.EMAIL_PASSWORD_RESET_EXPIRY_HOURS, 10) || 1,
      },
      appointmentConfirmation: {
        subject: process.env.EMAIL_APPOINTMENT_CONFIRMATION_SUBJECT || 'Appointment Confirmed',
        template: 'appointment-confirmation',
      },
      appointmentReminder: {
        subject: process.env.EMAIL_APPOINTMENT_REMINDER_SUBJECT || 'Appointment Reminder',
        template: 'appointment-reminder',
      },
      appointmentCancellation: {
        subject: process.env.EMAIL_APPOINTMENT_CANCELLATION_SUBJECT || 'Appointment Cancelled',
        template: 'appointment-cancellation',
      },
      paymentConfirmation: {
        subject: process.env.EMAIL_PAYMENT_CONFIRMATION_SUBJECT || 'Payment Confirmation',
        template: 'payment-confirmation',
      },
      invoice: {
        subject: process.env.EMAIL_INVOICE_SUBJECT || 'Your Invoice',
        template: 'invoice',
      },
      newsletter: {
        subject: process.env.EMAIL_NEWSLETTER_SUBJECT || 'Newsletter',
        template: 'newsletter',
      },
      notification: {
        subject: process.env.EMAIL_NOTIFICATION_SUBJECT || 'Notification',
        template: 'notification',
      },
    },
  },
  
  // Queue configuration
  queue: {
    enabled: process.env.EMAIL_QUEUE_ENABLED !== 'false',
    name: process.env.EMAIL_QUEUE_NAME || 'email-queue',
    concurrency: parseInt(process.env.EMAIL_QUEUE_CONCURRENCY, 10) || 5,
    attempts: parseInt(process.env.EMAIL_QUEUE_ATTEMPTS, 10) || 3,
    backoff: {
      type: process.env.EMAIL_QUEUE_BACKOFF_TYPE || 'exponential',
      delay: parseInt(process.env.EMAIL_QUEUE_BACKOFF_DELAY, 10) || 2000,
    },
    removeOnComplete: parseInt(process.env.EMAIL_QUEUE_REMOVE_ON_COMPLETE, 10) || 100,
    removeOnFail: parseInt(process.env.EMAIL_QUEUE_REMOVE_ON_FAIL, 10) || 50,
  },
  
  // Bulk email configuration
  bulk: {
    enabled: process.env.EMAIL_BULK_ENABLED === 'true',
    batchSize: parseInt(process.env.EMAIL_BULK_BATCH_SIZE, 10) || 100,
    delayBetweenBatches: parseInt(process.env.EMAIL_BULK_DELAY_BETWEEN_BATCHES, 10) || 1000,
    maxRecipientsPerEmail: parseInt(process.env.EMAIL_BULK_MAX_RECIPIENTS, 10) || 50,
  },
  
  // Tracking configuration
  tracking: {
    enabled: process.env.EMAIL_TRACKING_ENABLED === 'true',
    openTracking: process.env.EMAIL_OPEN_TRACKING_ENABLED === 'true',
    clickTracking: process.env.EMAIL_CLICK_TRACKING_ENABLED === 'true',
    unsubscribeTracking: process.env.EMAIL_UNSUBSCRIBE_TRACKING_ENABLED !== 'false',
  },
  
  // Spam prevention
  spamPrevention: {
    enabled: process.env.EMAIL_SPAM_PREVENTION_ENABLED !== 'false',
    maxEmailsPerHour: parseInt(process.env.EMAIL_MAX_EMAILS_PER_HOUR, 10) || 100,
    maxEmailsPerDay: parseInt(process.env.EMAIL_MAX_EMAILS_PER_DAY, 10) || 1000,
    blacklistedDomains: process.env.EMAIL_BLACKLISTED_DOMAINS ? 
      process.env.EMAIL_BLACKLISTED_DOMAINS.split(',') : [],
    requireDoubleOptIn: process.env.EMAIL_REQUIRE_DOUBLE_OPT_IN === 'true',
  },
  
  // Bounce handling
  bounceHandling: {
    enabled: process.env.EMAIL_BOUNCE_HANDLING_ENABLED === 'true',
    webhookUrl: process.env.EMAIL_BOUNCE_WEBHOOK_URL || '/api/v1/webhooks/email/bounce',
    maxBounces: parseInt(process.env.EMAIL_MAX_BOUNCES, 10) || 3,
    suppressAfterBounces: process.env.EMAIL_SUPPRESS_AFTER_BOUNCES !== 'false',
  },
  
  // Third-party services
  services: {
    sendgrid: {
      enabled: process.env.SENDGRID_ENABLED === 'true',
      apiKey: process.env.SENDGRID_API_KEY,
      webhookVerificationKey: process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY,
    },
    mailgun: {
      enabled: process.env.MAILGUN_ENABLED === 'true',
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
      webhookSigningKey: process.env.MAILGUN_WEBHOOK_SIGNING_KEY,
    },
    ses: {
      enabled: process.env.AWS_SES_ENABLED === 'true',
      region: process.env.AWS_SES_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
    },
  },
  
  // Development settings
  development: {
    enabled: process.env.NODE_ENV === 'development',
    catchAll: process.env.EMAIL_DEV_CATCH_ALL,
    logEmails: process.env.EMAIL_DEV_LOG_EMAILS !== 'false',
    saveToFile: process.env.EMAIL_DEV_SAVE_TO_FILE === 'true',
    fileDirectory: process.env.EMAIL_DEV_FILE_DIRECTORY || './temp/emails',
  },
  
  // Testing
  testing: {
    enabled: process.env.NODE_ENV === 'test',
    mockSending: process.env.EMAIL_MOCK_SENDING !== 'false',
    testRecipient: process.env.EMAIL_TEST_RECIPIENT || 'test@example.com',
  },
}));