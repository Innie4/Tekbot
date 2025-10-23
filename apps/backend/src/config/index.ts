// Configuration imports
import { databaseConfig } from './database.config';
import { authConfig } from './auth.config';
import { redisConfig } from './redis.config';
import { openaiConfig } from './openai.config';
import { stripeConfig } from './stripe.config';
import { paystackConfig } from './paystack.config';
import { twilioConfig } from './twilio.config';
import { emailConfig } from './email.config';
import { slackConfig } from './slack.config';
import { calendlyConfig } from './calendly.config';

// Configuration exports
export { databaseConfig } from './database.config';
export { authConfig } from './auth.config';
export { redisConfig } from './redis.config';
export { openaiConfig } from './openai.config';
export { stripeConfig } from './stripe.config';
export { paystackConfig } from './paystack.config';
export { twilioConfig } from './twilio.config';
export { emailConfig } from './email.config';
export { slackConfig } from './slack.config';
export { calendlyConfig } from './calendly.config';

// Configuration array for easy registration
export const configurations = [
  databaseConfig,
  authConfig,
  redisConfig,
  openaiConfig,
  stripeConfig,
  paystackConfig,
  twilioConfig,
  emailConfig,
  slackConfig,
  calendlyConfig,
];

// Configuration validation schema
export const configValidationSchema = {
  // Database
  DATABASE_URL: {
    required: true,
    type: 'string',
  },
  DATABASE_HOST: {
    required: false,
    type: 'string',
    default: 'localhost',
  },
  DATABASE_PORT: {
    required: false,
    type: 'number',
    default: 5432,
  },
  DATABASE_NAME: {
    required: false,
    type: 'string',
    default: 'tekbot',
  },
  DATABASE_USER: {
    required: false,
    type: 'string',
    default: 'postgres',
  },
  DATABASE_PASSWORD: {
    required: true,
    type: 'string',
  },

  // Redis
  REDIS_HOST: {
    required: false,
    type: 'string',
    default: 'localhost',
  },
  REDIS_PORT: {
    required: false,
    type: 'number',
    default: 6379,
  },
  REDIS_PASSWORD: {
    required: false,
    type: 'string',
  },

  // Authentication
  JWT_SECRET: {
    required: true,
    type: 'string',
  },
  JWT_REFRESH_SECRET: {
    required: true,
    type: 'string',
  },

  // OpenAI
  OPENAI_API_KEY: {
    required: true,
    type: 'string',
  },

  // Stripe
  STRIPE_SECRET_KEY: {
    required: true,
    type: 'string',
  },
  STRIPE_WEBHOOK_SECRET: {
    required: true,
    type: 'string',
  },

  // Paystack
  PAYSTACK_SECRET_KEY: {
    required: true,
    type: 'string',
  },

  // Twilio
  TWILIO_ACCOUNT_SID: {
    required: false,
    type: 'string',
  },
  TWILIO_AUTH_TOKEN: {
    required: false,
    type: 'string',
  },

  // Email
  SMTP_HOST: {
    required: false,
    type: 'string',
    default: 'smtp.gmail.com',
  },
  SMTP_USER: {
    required: false,
    type: 'string',
  },
  SMTP_PASS: {
    required: false,
    type: 'string',
  },

  // Slack
  SLACK_BOT_TOKEN: {
    required: false,
    type: 'string',
  },
  SLACK_SIGNING_SECRET: {
    required: false,
    type: 'string',
  },

  // Calendly
  CALENDLY_API_KEY: {
    required: false,
    type: 'string',
  },
  CALENDLY_PERSONAL_ACCESS_TOKEN: {
    required: false,
    type: 'string',
  },
};

// Environment-specific configuration
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  const baseConfig = {
    nodeEnv: env,
    port: parseInt(process.env.PORT, 10) || 3000,
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000'],

    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',

    // Rate limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,

    // File uploads
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',

    // Logging
    logLevel:
      process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
    logFormat: process.env.LOG_FORMAT || 'combined',

    // Health checks
    healthCheckPath: process.env.HEALTH_CHECK_PATH || '/health',

    // Documentation
    swaggerEnabled: process.env.SWAGGER_ENABLED !== 'false',
    swaggerPath: process.env.SWAGGER_PATH || '/api/docs',
  };

  // Environment-specific overrides
  switch (env) {
    case 'production':
      return {
        ...baseConfig,
        corsOrigins: process.env.CORS_ORIGINS
          ? process.env.CORS_ORIGINS.split(',')
          : ['https://app.tekbot.com'],
        swaggerEnabled: process.env.SWAGGER_ENABLED === 'true',
        logLevel: 'info',
      };

    case 'staging':
      return {
        ...baseConfig,
        corsOrigins: process.env.CORS_ORIGINS
          ? process.env.CORS_ORIGINS.split(',')
          : ['https://staging.tekbot.com'],
        logLevel: 'debug',
      };

    case 'test':
      return {
        ...baseConfig,
        port: parseInt(process.env.TEST_PORT, 10) || 3001,
        logLevel: 'error',
        swaggerEnabled: false,
      };

    default: // development
      return {
        ...baseConfig,
        corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
        logLevel: 'debug',
      };
  }
};
