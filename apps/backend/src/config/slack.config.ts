import { registerAs } from '@nestjs/config';

export const slackConfig = registerAs('slack', () => ({
  // Bot configuration
  bot: {
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
  },

  // OAuth configuration
  oauth: {
    enabled: process.env.SLACK_OAUTH_ENABLED === 'true',
    redirectUri:
      process.env.SLACK_OAUTH_REDIRECT_URI ||
      'https://app.tekbot.com/auth/slack/callback',
    scopes: process.env.SLACK_OAUTH_SCOPES
      ? process.env.SLACK_OAUTH_SCOPES.split(',')
      : [
          'chat:write',
          'chat:write.public',
          'channels:read',
          'groups:read',
          'im:read',
          'mpim:read',
          'users:read',
          'users:read.email',
          'team:read',
        ],
  },

  // Webhook configuration
  webhooks: {
    enabled: process.env.SLACK_WEBHOOKS_ENABLED !== 'false',
    url: process.env.SLACK_WEBHOOK_URL,
    verificationToken: process.env.SLACK_VERIFICATION_TOKEN,
    endpoints: {
      events:
        process.env.SLACK_EVENTS_ENDPOINT || '/api/v1/webhooks/slack/events',
      interactions:
        process.env.SLACK_INTERACTIONS_ENDPOINT ||
        '/api/v1/webhooks/slack/interactions',
      commands:
        process.env.SLACK_COMMANDS_ENDPOINT ||
        '/api/v1/webhooks/slack/commands',
    },
  },

  // Channels configuration
  channels: {
    default: process.env.SLACK_DEFAULT_CHANNEL || '#general',
    alerts: process.env.SLACK_ALERTS_CHANNEL || '#alerts',
    notifications: process.env.SLACK_NOTIFICATIONS_CHANNEL || '#notifications',
    support: process.env.SLACK_SUPPORT_CHANNEL || '#support',
    leads: process.env.SLACK_LEADS_CHANNEL || '#leads',
    appointments: process.env.SLACK_APPOINTMENTS_CHANNEL || '#appointments',
    payments: process.env.SLACK_PAYMENTS_CHANNEL || '#payments',
    errors: process.env.SLACK_ERRORS_CHANNEL || '#errors',
    deployments: process.env.SLACK_DEPLOYMENTS_CHANNEL || '#deployments',
  },

  // Message formatting
  formatting: {
    username: process.env.SLACK_BOT_USERNAME || 'TekBot',
    iconEmoji: process.env.SLACK_BOT_ICON_EMOJI || ':robot_face:',
    iconUrl: process.env.SLACK_BOT_ICON_URL,
    linkNames: process.env.SLACK_LINK_NAMES !== 'false',
    unfurlLinks: process.env.SLACK_UNFURL_LINKS === 'true',
    unfurlMedia: process.env.SLACK_UNFURL_MEDIA === 'true',
  },

  // Notification types
  notifications: {
    newLead: {
      enabled: process.env.SLACK_NEW_LEAD_NOTIFICATIONS_ENABLED !== 'false',
      channel: process.env.SLACK_NEW_LEAD_CHANNEL || '#leads',
      mentions: process.env.SLACK_NEW_LEAD_MENTIONS
        ? process.env.SLACK_NEW_LEAD_MENTIONS.split(',')
        : [],
    },
    appointmentBooked: {
      enabled:
        process.env.SLACK_APPOINTMENT_BOOKED_NOTIFICATIONS_ENABLED !== 'false',
      channel: process.env.SLACK_APPOINTMENT_BOOKED_CHANNEL || '#appointments',
      mentions: process.env.SLACK_APPOINTMENT_BOOKED_MENTIONS
        ? process.env.SLACK_APPOINTMENT_BOOKED_MENTIONS.split(',')
        : [],
    },
    appointmentCancelled: {
      enabled:
        process.env.SLACK_APPOINTMENT_CANCELLED_NOTIFICATIONS_ENABLED !==
        'false',
      channel:
        process.env.SLACK_APPOINTMENT_CANCELLED_CHANNEL || '#appointments',
      mentions: process.env.SLACK_APPOINTMENT_CANCELLED_MENTIONS
        ? process.env.SLACK_APPOINTMENT_CANCELLED_MENTIONS.split(',')
        : [],
    },
    paymentReceived: {
      enabled:
        process.env.SLACK_PAYMENT_RECEIVED_NOTIFICATIONS_ENABLED !== 'false',
      channel: process.env.SLACK_PAYMENT_RECEIVED_CHANNEL || '#payments',
      mentions: process.env.SLACK_PAYMENT_RECEIVED_MENTIONS
        ? process.env.SLACK_PAYMENT_RECEIVED_MENTIONS.split(',')
        : [],
    },
    paymentFailed: {
      enabled:
        process.env.SLACK_PAYMENT_FAILED_NOTIFICATIONS_ENABLED !== 'false',
      channel: process.env.SLACK_PAYMENT_FAILED_CHANNEL || '#payments',
      mentions: process.env.SLACK_PAYMENT_FAILED_MENTIONS
        ? process.env.SLACK_PAYMENT_FAILED_MENTIONS.split(',')
        : ['@channel'],
    },
    systemError: {
      enabled: process.env.SLACK_SYSTEM_ERROR_NOTIFICATIONS_ENABLED !== 'false',
      channel: process.env.SLACK_SYSTEM_ERROR_CHANNEL || '#errors',
      mentions: process.env.SLACK_SYSTEM_ERROR_MENTIONS
        ? process.env.SLACK_SYSTEM_ERROR_MENTIONS.split(',')
        : ['@channel'],
    },
    humanHandoff: {
      enabled:
        process.env.SLACK_HUMAN_HANDOFF_NOTIFICATIONS_ENABLED !== 'false',
      channel: process.env.SLACK_HUMAN_HANDOFF_CHANNEL || '#support',
      mentions: process.env.SLACK_HUMAN_HANDOFF_MENTIONS
        ? process.env.SLACK_HUMAN_HANDOFF_MENTIONS.split(',')
        : ['@here'],
    },
    deployment: {
      enabled: process.env.SLACK_DEPLOYMENT_NOTIFICATIONS_ENABLED === 'true',
      channel: process.env.SLACK_DEPLOYMENT_CHANNEL || '#deployments',
      mentions: process.env.SLACK_DEPLOYMENT_MENTIONS
        ? process.env.SLACK_DEPLOYMENT_MENTIONS.split(',')
        : [],
    },
  },

  // Rate limiting
  rateLimit: {
    enabled: process.env.SLACK_RATE_LIMIT_ENABLED !== 'false',
    messagesPerSecond: parseInt(process.env.SLACK_MESSAGES_PER_SECOND, 10) || 1,
    messagesPerMinute:
      parseInt(process.env.SLACK_MESSAGES_PER_MINUTE, 10) || 60,
    burstLimit: parseInt(process.env.SLACK_BURST_LIMIT, 10) || 5,
  },

  // Retry configuration
  retry: {
    enabled: process.env.SLACK_RETRY_ENABLED !== 'false',
    maxAttempts: parseInt(process.env.SLACK_MAX_RETRY_ATTEMPTS, 10) || 3,
    backoffMultiplier:
      parseFloat(process.env.SLACK_RETRY_BACKOFF_MULTIPLIER) || 2,
    initialDelay: parseInt(process.env.SLACK_RETRY_INITIAL_DELAY, 10) || 1000,
    maxDelay: parseInt(process.env.SLACK_RETRY_MAX_DELAY, 10) || 30000,
  },

  // Message templates
  templates: {
    newLead: {
      title: ':star: New Lead Received',
      color: '#36a64f',
    },
    appointmentBooked: {
      title: ':calendar: Appointment Booked',
      color: '#36a64f',
    },
    appointmentCancelled: {
      title: ':x: Appointment Cancelled',
      color: '#ff9900',
    },
    paymentReceived: {
      title: ':money_with_wings: Payment Received',
      color: '#36a64f',
    },
    paymentFailed: {
      title: ':warning: Payment Failed',
      color: '#ff0000',
    },
    systemError: {
      title: ':rotating_light: System Error',
      color: '#ff0000',
    },
    humanHandoff: {
      title: ':raising_hand: Human Assistance Requested',
      color: '#ff9900',
    },
    deployment: {
      title: ':rocket: Deployment Notification',
      color: '#0099cc',
    },
  },

  // Slash commands
  commands: {
    enabled: process.env.SLACK_COMMANDS_ENABLED === 'true',
    prefix: process.env.SLACK_COMMAND_PREFIX || '/tekbot',
    commands: {
      help: {
        enabled: true,
        description: 'Show available commands',
      },
      status: {
        enabled: true,
        description: 'Check system status',
      },
      leads: {
        enabled: true,
        description: 'Get recent leads',
      },
      appointments: {
        enabled: true,
        description: 'Get upcoming appointments',
      },
    },
  },

  // Interactive components
  interactive: {
    enabled: process.env.SLACK_INTERACTIVE_ENABLED === 'true',
    buttons: {
      enabled: process.env.SLACK_BUTTONS_ENABLED !== 'false',
    },
    modals: {
      enabled: process.env.SLACK_MODALS_ENABLED === 'true',
    },
    shortcuts: {
      enabled: process.env.SLACK_SHORTCUTS_ENABLED === 'true',
    },
  },

  // Logging
  logging: {
    enabled: process.env.SLACK_LOGGING_ENABLED === 'true',
    logRequests: process.env.SLACK_LOG_REQUESTS === 'true',
    logResponses: process.env.SLACK_LOG_RESPONSES === 'true',
    logErrors: process.env.SLACK_LOG_ERRORS !== 'false',
    logWebhooks: process.env.SLACK_LOG_WEBHOOKS === 'true',
  },

  // Testing
  testing: {
    enabled: process.env.NODE_ENV !== 'production',
    testChannel: process.env.SLACK_TEST_CHANNEL || '#test',
    mockNotifications: process.env.SLACK_MOCK_NOTIFICATIONS === 'true',
    testUsers: process.env.SLACK_TEST_USERS
      ? process.env.SLACK_TEST_USERS.split(',')
      : [],
  },
}));
