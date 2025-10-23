import { registerAs } from '@nestjs/config';

export const paystackConfig = registerAs('paystack', () => ({
  secretKey: process.env.PAYSTACK_SECRET_KEY,
  publicKey: process.env.PAYSTACK_PUBLIC_KEY,
  currency: process.env.PAYSTACK_CURRENCY || 'NGN',
  successUrl: process.env.PAYSTACK_SUCCESS_URL || 'http://localhost:3000/payment/success',
  cancelUrl: process.env.PAYSTACK_CANCEL_URL || 'http://localhost:3000/payment/cancel',
}));