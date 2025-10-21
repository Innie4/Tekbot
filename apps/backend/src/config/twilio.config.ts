import { registerAs } from '@nestjs/config';

export const twilioConfig = registerAs('twilio', () => ({
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  apiKey: process.env.TWILIO_API_KEY,
  apiSecret: process.env.TWILIO_API_SECRET,

  // Phone numbers
  phoneNumbers: {
    main: process.env.TWILIO_PHONE_NUMBER,
    whatsapp: process.env.TWILIO_WHATSAPP_NUMBER,
    sms: process.env.TWILIO_SMS_NUMBER,
  },

  // WhatsApp configuration
  whatsapp: {
    enabled: process.env.TWILIO_WHATSAPP_ENABLED !== 'false',
    sandbox: process.env.TWILIO_WHATSAPP_SANDBOX === 'true',
    webhookUrl:
      process.env.TWILIO_WHATSAPP_WEBHOOK_URL ||
      '/api/v1/webhooks/twilio/whatsapp',
    statusCallbackUrl:
      process.env.TWILIO_WHATSAPP_STATUS_CALLBACK_URL ||
      '/api/v1/webhooks/twilio/whatsapp/status',
    maxMessageLength:
      parseInt(process.env.TWILIO_WHATSAPP_MAX_MESSAGE_LENGTH, 10) || 1600,
    mediaSupport: {
      images: process.env.TWILIO_WHATSAPP_IMAGES_ENABLED !== 'false',
      documents: process.env.TWILIO_WHATSAPP_DOCUMENTS_ENABLED !== 'false',
      audio: process.env.TWILIO_WHATSAPP_AUDIO_ENABLED !== 'false',
      video: process.env.TWILIO_WHATSAPP_VIDEO_ENABLED !== 'false',
    },
    templates: {
      enabled: process.env.TWILIO_WHATSAPP_TEMPLATES_ENABLED === 'true',
      namespace: process.env.TWILIO_WHATSAPP_TEMPLATE_NAMESPACE,
    },
  },

  // SMS configuration
  sms: {
    enabled: process.env.TWILIO_SMS_ENABLED !== 'false',
    webhookUrl:
      process.env.TWILIO_SMS_WEBHOOK_URL || '/api/v1/webhooks/twilio/sms',
    statusCallbackUrl:
      process.env.TWILIO_SMS_STATUS_CALLBACK_URL ||
      '/api/v1/webhooks/twilio/sms/status',
    maxMessageLength:
      parseInt(process.env.TWILIO_SMS_MAX_MESSAGE_LENGTH, 10) || 1600,
    smartEncoding: process.env.TWILIO_SMS_SMART_ENCODING !== 'false',
    shortenUrls: process.env.TWILIO_SMS_SHORTEN_URLS === 'true',
  },

  // Voice configuration
  voice: {
    enabled: process.env.TWILIO_VOICE_ENABLED === 'true',
    webhookUrl:
      process.env.TWILIO_VOICE_WEBHOOK_URL || '/api/v1/webhooks/twilio/voice',
    statusCallbackUrl:
      process.env.TWILIO_VOICE_STATUS_CALLBACK_URL ||
      '/api/v1/webhooks/twilio/voice/status',
    recordCalls: process.env.TWILIO_VOICE_RECORD_CALLS === 'true',
    transcribeRecordings:
      process.env.TWILIO_VOICE_TRANSCRIBE_RECORDINGS === 'true',
  },

  // Video configuration
  video: {
    enabled: process.env.TWILIO_VIDEO_ENABLED === 'true',
    webhookUrl:
      process.env.TWILIO_VIDEO_WEBHOOK_URL || '/api/v1/webhooks/twilio/video',
    statusCallbackUrl:
      process.env.TWILIO_VIDEO_STATUS_CALLBACK_URL ||
      '/api/v1/webhooks/twilio/video/status',
    recordSessions: process.env.TWILIO_VIDEO_RECORD_SESSIONS === 'true',
  },

  // Chat configuration
  chat: {
    enabled: process.env.TWILIO_CHAT_ENABLED === 'true',
    serviceSid: process.env.TWILIO_CHAT_SERVICE_SID,
    webhookUrl:
      process.env.TWILIO_CHAT_WEBHOOK_URL || '/api/v1/webhooks/twilio/chat',
  },

  // Messaging service
  messagingService: {
    sid: process.env.TWILIO_MESSAGING_SERVICE_SID,
    enabled: process.env.TWILIO_MESSAGING_SERVICE_ENABLED === 'true',
    useAlphanumericSender:
      process.env.TWILIO_USE_ALPHANUMERIC_SENDER === 'true',
    smartEncoding: process.env.TWILIO_MESSAGING_SMART_ENCODING !== 'false',
    fallbackToLongCode: process.env.TWILIO_FALLBACK_TO_LONG_CODE !== 'false',
  },

  // Verify service (for OTP)
  verify: {
    enabled: process.env.TWILIO_VERIFY_ENABLED === 'true',
    serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    codeLength: parseInt(process.env.TWILIO_VERIFY_CODE_LENGTH, 10) || 6,
    ttl: parseInt(process.env.TWILIO_VERIFY_TTL, 10) || 600, // 10 minutes
    maxAttempts: parseInt(process.env.TWILIO_VERIFY_MAX_ATTEMPTS, 10) || 5,
  },

  // Lookup service
  lookup: {
    enabled: process.env.TWILIO_LOOKUP_ENABLED === 'true',
    carrierInfo: process.env.TWILIO_LOOKUP_CARRIER_INFO === 'true',
    callerName: process.env.TWILIO_LOOKUP_CALLER_NAME === 'true',
  },

  // Webhook security
  webhooks: {
    validateSignature:
      process.env.TWILIO_VALIDATE_WEBHOOK_SIGNATURE !== 'false',
    authToken:
      process.env.TWILIO_WEBHOOK_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN,
    timeout: parseInt(process.env.TWILIO_WEBHOOK_TIMEOUT, 10) || 15000, // 15 seconds
  },

  // Rate limiting
  rateLimit: {
    enabled: process.env.TWILIO_RATE_LIMIT_ENABLED !== 'false',
    messagesPerSecond:
      parseInt(process.env.TWILIO_MESSAGES_PER_SECOND, 10) || 1,
    messagesPerMinute:
      parseInt(process.env.TWILIO_MESSAGES_PER_MINUTE, 10) || 60,
    messagesPerHour: parseInt(process.env.TWILIO_MESSAGES_PER_HOUR, 10) || 3600,
  },

  // Error handling
  errorHandling: {
    retryAttempts: parseInt(process.env.TWILIO_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.TWILIO_RETRY_DELAY, 10) || 1000,
    exponentialBackoff: process.env.TWILIO_EXPONENTIAL_BACKOFF !== 'false',
  },

  // Logging
  logging: {
    enabled: process.env.TWILIO_LOGGING_ENABLED === 'true',
    logRequests: process.env.TWILIO_LOG_REQUESTS === 'true',
    logResponses: process.env.TWILIO_LOG_RESPONSES === 'true',
    logErrors: process.env.TWILIO_LOG_ERRORS !== 'false',
    logWebhooks: process.env.TWILIO_LOG_WEBHOOKS === 'true',
  },

  // Testing
  testing: {
    enabled: process.env.NODE_ENV !== 'production',
    testNumbers: process.env.TWILIO_TEST_NUMBERS
      ? process.env.TWILIO_TEST_NUMBERS.split(',')
      : ['+15005550006'],
    mockResponses: process.env.TWILIO_MOCK_RESPONSES === 'true',
  },
}));
