import { registerAs } from '@nestjs/config';

export const stripeConfig = registerAs('stripe', () => ({
  publicKey: process.env.STRIPE_PUBLIC_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  // API configuration
  apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
  timeout: parseInt(process.env.STRIPE_TIMEOUT, 10) || 80000, // 80 seconds
  maxNetworkRetries: parseInt(process.env.STRIPE_MAX_RETRIES, 10) || 3,

  // Currency settings
  defaultCurrency: process.env.STRIPE_DEFAULT_CURRENCY || 'usd',
  supportedCurrencies: process.env.STRIPE_SUPPORTED_CURRENCIES
    ? process.env.STRIPE_SUPPORTED_CURRENCIES.split(',')
    : ['usd', 'eur', 'gbp'],

  // Payment methods
  paymentMethods: {
    card: {
      enabled: process.env.STRIPE_CARD_ENABLED !== 'false',
      captureMethod: process.env.STRIPE_CARD_CAPTURE_METHOD || 'automatic', // 'automatic' or 'manual'
      confirmationMethod:
        process.env.STRIPE_CARD_CONFIRMATION_METHOD || 'automatic', // 'automatic' or 'manual'
    },
    applePay: {
      enabled: process.env.STRIPE_APPLE_PAY_ENABLED === 'true',
    },
    googlePay: {
      enabled: process.env.STRIPE_GOOGLE_PAY_ENABLED === 'true',
    },
    ach: {
      enabled: process.env.STRIPE_ACH_ENABLED === 'true',
    },
    sepa: {
      enabled: process.env.STRIPE_SEPA_ENABLED === 'true',
    },
  },

  // Subscription settings
  subscriptions: {
    defaultTrialDays: parseInt(process.env.STRIPE_DEFAULT_TRIAL_DAYS, 10) || 14,
    gracePeriodDays: parseInt(process.env.STRIPE_GRACE_PERIOD_DAYS, 10) || 3,
    prorationBehavior:
      process.env.STRIPE_PRORATION_BEHAVIOR || 'create_prorations',
  },

  // Webhook settings
  webhooks: {
    tolerance: parseInt(process.env.STRIPE_WEBHOOK_TOLERANCE, 10) || 300, // 5 minutes
    endpoints: {
      payments:
        process.env.STRIPE_WEBHOOK_PAYMENTS_ENDPOINT ||
        '/api/v1/webhooks/stripe/payments',
      subscriptions:
        process.env.STRIPE_WEBHOOK_SUBSCRIPTIONS_ENDPOINT ||
        '/api/v1/webhooks/stripe/subscriptions',
      customers:
        process.env.STRIPE_WEBHOOK_CUSTOMERS_ENDPOINT ||
        '/api/v1/webhooks/stripe/customers',
    },
  },

  // Connect settings (for marketplace)
  connect: {
    enabled: process.env.STRIPE_CONNECT_ENABLED === 'true',
    clientId: process.env.STRIPE_CONNECT_CLIENT_ID,
    platformFeePercent:
      parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT) || 2.9,
    applicationFeePercent:
      parseFloat(process.env.STRIPE_APPLICATION_FEE_PERCENT) || 0.5,
  },

  // Fraud prevention
  radar: {
    enabled: process.env.STRIPE_RADAR_ENABLED === 'true',
    riskThreshold: parseFloat(process.env.STRIPE_RISK_THRESHOLD) || 0.7,
  },

  // Reporting
  reporting: {
    enabled: process.env.STRIPE_REPORTING_ENABLED === 'true',
    interval: process.env.STRIPE_REPORTING_INTERVAL || 'daily', // 'daily', 'weekly', 'monthly'
  },

  // Testing
  testing: {
    enabled: process.env.NODE_ENV !== 'production',
    testClockId: process.env.STRIPE_TEST_CLOCK_ID,
  },
}));
