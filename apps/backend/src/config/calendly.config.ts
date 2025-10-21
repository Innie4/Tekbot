import { registerAs } from '@nestjs/config';

export const calendlyConfig = registerAs('calendly', () => ({
  // API configuration
  apiKey: process.env.CALENDLY_API_KEY,
  personalAccessToken: process.env.CALENDLY_PERSONAL_ACCESS_TOKEN,
  baseUrl: process.env.CALENDLY_BASE_URL || 'https://api.calendly.com',

  // OAuth configuration
  oauth: {
    enabled: process.env.CALENDLY_OAUTH_ENABLED === 'true',
    clientId: process.env.CALENDLY_CLIENT_ID,
    clientSecret: process.env.CALENDLY_CLIENT_SECRET,
    redirectUri:
      process.env.CALENDLY_REDIRECT_URI ||
      'https://app.tekbot.com/auth/calendly/callback',
    scopes: process.env.CALENDLY_SCOPES
      ? process.env.CALENDLY_SCOPES.split(',')
      : [
          'default',
          'read_events',
          'write_events',
          'read_event_types',
          'write_event_types',
        ],
  },

  // User configuration
  user: {
    uuid: process.env.CALENDLY_USER_UUID,
    uri: process.env.CALENDLY_USER_URI,
    schedulingUrl: process.env.CALENDLY_SCHEDULING_URL,
    timezone: process.env.CALENDLY_TIMEZONE || 'America/New_York',
  },

  // Organization configuration
  organization: {
    uuid: process.env.CALENDLY_ORGANIZATION_UUID,
    uri: process.env.CALENDLY_ORGANIZATION_URI,
  },

  // Event types configuration
  eventTypes: {
    default: {
      uuid: process.env.CALENDLY_DEFAULT_EVENT_TYPE_UUID,
      uri: process.env.CALENDLY_DEFAULT_EVENT_TYPE_URI,
      duration: parseInt(process.env.CALENDLY_DEFAULT_DURATION, 10) || 30, // minutes
      bufferTime: {
        before: parseInt(process.env.CALENDLY_BUFFER_BEFORE, 10) || 0,
        after: parseInt(process.env.CALENDLY_BUFFER_AFTER, 10) || 0,
      },
    },
    consultation: {
      uuid: process.env.CALENDLY_CONSULTATION_EVENT_TYPE_UUID,
      uri: process.env.CALENDLY_CONSULTATION_EVENT_TYPE_URI,
      duration: parseInt(process.env.CALENDLY_CONSULTATION_DURATION, 10) || 60,
    },
    demo: {
      uuid: process.env.CALENDLY_DEMO_EVENT_TYPE_UUID,
      uri: process.env.CALENDLY_DEMO_EVENT_TYPE_URI,
      duration: parseInt(process.env.CALENDLY_DEMO_DURATION, 10) || 45,
    },
  },

  // Webhook configuration
  webhooks: {
    enabled: process.env.CALENDLY_WEBHOOKS_ENABLED !== 'false',
    signingKey: process.env.CALENDLY_WEBHOOK_SIGNING_KEY,
    endpoints: {
      inviteeCreated:
        process.env.CALENDLY_WEBHOOK_INVITEE_CREATED ||
        '/api/v1/webhooks/calendly/invitee.created',
      inviteeCanceled:
        process.env.CALENDLY_WEBHOOK_INVITEE_CANCELED ||
        '/api/v1/webhooks/calendly/invitee.canceled',
      inviteeNoShow:
        process.env.CALENDLY_WEBHOOK_INVITEE_NO_SHOW ||
        '/api/v1/webhooks/calendly/invitee.no_show',
      inviteeRescheduled:
        process.env.CALENDLY_WEBHOOK_INVITEE_RESCHEDULED ||
        '/api/v1/webhooks/calendly/invitee.rescheduled',
    },
    events: process.env.CALENDLY_WEBHOOK_EVENTS
      ? process.env.CALENDLY_WEBHOOK_EVENTS.split(',')
      : [
          'invitee.created',
          'invitee.canceled',
          'invitee.no_show',
          'invitee.rescheduled',
        ],
    scope: process.env.CALENDLY_WEBHOOK_SCOPE || 'organization', // 'user' or 'organization'
  },

  // Scheduling preferences
  scheduling: {
    defaultDuration:
      parseInt(process.env.CALENDLY_DEFAULT_SCHEDULING_DURATION, 10) || 30,
    minimumNotice:
      parseInt(process.env.CALENDLY_MINIMUM_NOTICE_HOURS, 10) || 24, // hours
    maximumAdvance:
      parseInt(process.env.CALENDLY_MAXIMUM_ADVANCE_DAYS, 10) || 60, // days
    timeSlotInterval:
      parseInt(process.env.CALENDLY_TIME_SLOT_INTERVAL, 10) || 15, // minutes

    // Working hours
    workingHours: {
      monday: {
        enabled: process.env.CALENDLY_MONDAY_ENABLED !== 'false',
        start: process.env.CALENDLY_MONDAY_START || '09:00',
        end: process.env.CALENDLY_MONDAY_END || '17:00',
      },
      tuesday: {
        enabled: process.env.CALENDLY_TUESDAY_ENABLED !== 'false',
        start: process.env.CALENDLY_TUESDAY_START || '09:00',
        end: process.env.CALENDLY_TUESDAY_END || '17:00',
      },
      wednesday: {
        enabled: process.env.CALENDLY_WEDNESDAY_ENABLED !== 'false',
        start: process.env.CALENDLY_WEDNESDAY_START || '09:00',
        end: process.env.CALENDLY_WEDNESDAY_END || '17:00',
      },
      thursday: {
        enabled: process.env.CALENDLY_THURSDAY_ENABLED !== 'false',
        start: process.env.CALENDLY_THURSDAY_START || '09:00',
        end: process.env.CALENDLY_THURSDAY_END || '17:00',
      },
      friday: {
        enabled: process.env.CALENDLY_FRIDAY_ENABLED !== 'false',
        start: process.env.CALENDLY_FRIDAY_START || '09:00',
        end: process.env.CALENDLY_FRIDAY_END || '17:00',
      },
      saturday: {
        enabled: process.env.CALENDLY_SATURDAY_ENABLED === 'true',
        start: process.env.CALENDLY_SATURDAY_START || '10:00',
        end: process.env.CALENDLY_SATURDAY_END || '14:00',
      },
      sunday: {
        enabled: process.env.CALENDLY_SUNDAY_ENABLED === 'true',
        start: process.env.CALENDLY_SUNDAY_START || '10:00',
        end: process.env.CALENDLY_SUNDAY_END || '14:00',
      },
    },
  },

  // Notification settings
  notifications: {
    email: {
      enabled: process.env.CALENDLY_EMAIL_NOTIFICATIONS_ENABLED !== 'false',
      confirmationEnabled:
        process.env.CALENDLY_EMAIL_CONFIRMATION_ENABLED !== 'false',
      reminderEnabled: process.env.CALENDLY_EMAIL_REMINDER_ENABLED !== 'false',
      followUpEnabled: process.env.CALENDLY_EMAIL_FOLLOW_UP_ENABLED === 'true',
    },
    sms: {
      enabled: process.env.CALENDLY_SMS_NOTIFICATIONS_ENABLED === 'true',
      reminderEnabled: process.env.CALENDLY_SMS_REMINDER_ENABLED === 'true',
      reminderMinutes:
        parseInt(process.env.CALENDLY_SMS_REMINDER_MINUTES, 10) || 60,
    },
    slack: {
      enabled: process.env.CALENDLY_SLACK_NOTIFICATIONS_ENABLED === 'true',
      channel: process.env.CALENDLY_SLACK_CHANNEL || '#appointments',
    },
  },

  // Integration settings
  integrations: {
    googleCalendar: {
      enabled: process.env.CALENDLY_GOOGLE_CALENDAR_ENABLED === 'true',
      calendarId: process.env.CALENDLY_GOOGLE_CALENDAR_ID,
    },
    outlookCalendar: {
      enabled: process.env.CALENDLY_OUTLOOK_CALENDAR_ENABLED === 'true',
      calendarId: process.env.CALENDLY_OUTLOOK_CALENDAR_ID,
    },
    zoom: {
      enabled: process.env.CALENDLY_ZOOM_ENABLED === 'true',
      autoCreateMeetings: process.env.CALENDLY_ZOOM_AUTO_CREATE === 'true',
    },
    teams: {
      enabled: process.env.CALENDLY_TEAMS_ENABLED === 'true',
      autoCreateMeetings: process.env.CALENDLY_TEAMS_AUTO_CREATE === 'true',
    },
  },

  // Custom questions
  customQuestions: {
    enabled: process.env.CALENDLY_CUSTOM_QUESTIONS_ENABLED === 'true',
    questions: [
      {
        name: 'company',
        type: 'text',
        required: true,
        position: 1,
      },
      {
        name: 'phone',
        type: 'phone_number',
        required: true,
        position: 2,
      },
      {
        name: 'project_details',
        type: 'textarea',
        required: false,
        position: 3,
      },
    ],
  },

  // Rate limiting
  rateLimit: {
    enabled: process.env.CALENDLY_RATE_LIMIT_ENABLED !== 'false',
    requestsPerMinute:
      parseInt(process.env.CALENDLY_REQUESTS_PER_MINUTE, 10) || 100,
    requestsPerHour:
      parseInt(process.env.CALENDLY_REQUESTS_PER_HOUR, 10) || 1000,
  },

  // Caching
  cache: {
    enabled: process.env.CALENDLY_CACHE_ENABLED !== 'false',
    ttl: parseInt(process.env.CALENDLY_CACHE_TTL, 10) || 300, // 5 minutes
    eventTypesTtl:
      parseInt(process.env.CALENDLY_EVENT_TYPES_CACHE_TTL, 10) || 3600, // 1 hour
    availabilityTtl:
      parseInt(process.env.CALENDLY_AVAILABILITY_CACHE_TTL, 10) || 900, // 15 minutes
  },

  // Error handling
  errorHandling: {
    retryAttempts: parseInt(process.env.CALENDLY_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.CALENDLY_RETRY_DELAY, 10) || 1000,
    exponentialBackoff: process.env.CALENDLY_EXPONENTIAL_BACKOFF !== 'false',
    timeout: parseInt(process.env.CALENDLY_TIMEOUT, 10) || 30000, // 30 seconds
  },

  // Logging
  logging: {
    enabled: process.env.CALENDLY_LOGGING_ENABLED === 'true',
    logRequests: process.env.CALENDLY_LOG_REQUESTS === 'true',
    logResponses: process.env.CALENDLY_LOG_RESPONSES === 'true',
    logErrors: process.env.CALENDLY_LOG_ERRORS !== 'false',
    logWebhooks: process.env.CALENDLY_LOG_WEBHOOKS === 'true',
  },

  // Testing
  testing: {
    enabled: process.env.NODE_ENV !== 'production',
    mockResponses: process.env.CALENDLY_MOCK_RESPONSES === 'true',
    testEventTypeUuid: process.env.CALENDLY_TEST_EVENT_TYPE_UUID,
    testUserUuid: process.env.CALENDLY_TEST_USER_UUID,
  },
}));
