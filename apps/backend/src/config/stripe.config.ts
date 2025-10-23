import { registerAs } from '@nestjs/config';

export const stripeConfig = registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  apiVersion: process.env.STRIPE_API_VERSION || '2023-10-16',
  currency: process.env.STRIPE_CURRENCY || 'usd',
  successUrl: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/payment/success',
  cancelUrl: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/payment/cancel',
}));