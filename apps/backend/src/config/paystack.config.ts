import { registerAs } from '@nestjs/config';

export const paystackConfig = registerAs('paystack', () => ({
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  secretKey: process.env.PAYSTACK_SECRET_KEY,

  // API configuration
  baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  timeout: parseInt(process.env.PAYSTACK_TIMEOUT, 10) || 60000, // 60 seconds
  maxRetries: parseInt(process.env.PAYSTACK_MAX_RETRIES, 10) || 3,
  retryDelay: parseInt(process.env.PAYSTACK_RETRY_DELAY, 10) || 1000,

  // Currency settings
  defaultCurrency: process.env.PAYSTACK_DEFAULT_CURRENCY || 'NGN',
  supportedCurrencies: process.env.PAYSTACK_SUPPORTED_CURRENCIES
    ? process.env.PAYSTACK_SUPPORTED_CURRENCIES.split(',')
    : ['NGN', 'USD', 'GHS', 'ZAR', 'KES'],

  // Payment channels
  channels: {
    card: {
      enabled: process.env.PAYSTACK_CARD_ENABLED !== 'false',
    },
    bankTransfer: {
      enabled: process.env.PAYSTACK_BANK_TRANSFER_ENABLED !== 'false',
    },
    ussd: {
      enabled: process.env.PAYSTACK_USSD_ENABLED !== 'false',
    },
    qr: {
      enabled: process.env.PAYSTACK_QR_ENABLED !== 'false',
    },
    mobileMoney: {
      enabled: process.env.PAYSTACK_MOBILE_MONEY_ENABLED !== 'false',
    },
    bankAccount: {
      enabled: process.env.PAYSTACK_BANK_ACCOUNT_ENABLED !== 'false',
    },
    eft: {
      enabled: process.env.PAYSTACK_EFT_ENABLED !== 'false',
    },
  },

  // Transaction settings
  transactions: {
    defaultBearerType: process.env.PAYSTACK_DEFAULT_BEARER || 'account', // 'account' or 'subaccount'
    splitCode: process.env.PAYSTACK_SPLIT_CODE,
    subaccountCode: process.env.PAYSTACK_SUBACCOUNT_CODE,
    transactionCharge:
      parseInt(process.env.PAYSTACK_TRANSACTION_CHARGE, 10) || 0,
  },

  // Subscription settings
  subscriptions: {
    defaultInterval: process.env.PAYSTACK_DEFAULT_INTERVAL || 'monthly', // 'daily', 'weekly', 'monthly', 'quarterly', 'biannually', 'annually'
    sendInvoices: process.env.PAYSTACK_SEND_INVOICES !== 'false',
    sendSms: process.env.PAYSTACK_SEND_SMS !== 'false',
    invoiceLimit: parseInt(process.env.PAYSTACK_INVOICE_LIMIT, 10) || 1,
  },

  // Webhook settings
  webhooks: {
    secret: process.env.PAYSTACK_WEBHOOK_SECRET,
    endpoints: {
      charge:
        process.env.PAYSTACK_WEBHOOK_CHARGE_ENDPOINT ||
        '/api/v1/webhooks/paystack/charge',
      transfer:
        process.env.PAYSTACK_WEBHOOK_TRANSFER_ENDPOINT ||
        '/api/v1/webhooks/paystack/transfer',
      subscription:
        process.env.PAYSTACK_WEBHOOK_SUBSCRIPTION_ENDPOINT ||
        '/api/v1/webhooks/paystack/subscription',
      invoice:
        process.env.PAYSTACK_WEBHOOK_INVOICE_ENDPOINT ||
        '/api/v1/webhooks/paystack/invoice',
    },
    tolerance: parseInt(process.env.PAYSTACK_WEBHOOK_TOLERANCE, 10) || 300, // 5 minutes
  },

  // Transfer settings
  transfers: {
    enabled: process.env.PAYSTACK_TRANSFERS_ENABLED === 'true',
    reason:
      process.env.PAYSTACK_TRANSFER_REASON || 'Payout from TekBot Platform',
    currency: process.env.PAYSTACK_TRANSFER_CURRENCY || 'NGN',
    source: process.env.PAYSTACK_TRANSFER_SOURCE || 'balance',
  },

  // Verification settings
  verification: {
    bvn: {
      enabled: process.env.PAYSTACK_BVN_VERIFICATION_ENABLED === 'true',
    },
    accountNumber: {
      enabled: process.env.PAYSTACK_ACCOUNT_VERIFICATION_ENABLED === 'true',
    },
    cardBin: {
      enabled: process.env.PAYSTACK_CARD_BIN_VERIFICATION_ENABLED === 'true',
    },
  },

  // Dispute settings
  disputes: {
    autoResolve: process.env.PAYSTACK_AUTO_RESOLVE_DISPUTES === 'true',
    evidenceUpload: process.env.PAYSTACK_EVIDENCE_UPLOAD_ENABLED !== 'false',
  },

  // Refund settings
  refunds: {
    enabled: process.env.PAYSTACK_REFUNDS_ENABLED !== 'false',
    merchantNote:
      process.env.PAYSTACK_REFUND_MERCHANT_NOTE ||
      'Refund processed by TekBot Platform',
    customerNote:
      process.env.PAYSTACK_REFUND_CUSTOMER_NOTE ||
      'Your refund has been processed',
  },

  // Logging
  logging: {
    enabled: process.env.PAYSTACK_LOGGING_ENABLED === 'true',
    logRequests: process.env.PAYSTACK_LOG_REQUESTS === 'true',
    logResponses: process.env.PAYSTACK_LOG_RESPONSES === 'true',
    logErrors: process.env.PAYSTACK_LOG_ERRORS !== 'false',
  },

  // Testing
  testing: {
    enabled: process.env.NODE_ENV !== 'production',
    testCards: {
      successful: '4084084084084081',
      declined: '4084084084084081',
      timeout: '4084084084084081',
    },
  },
}));
