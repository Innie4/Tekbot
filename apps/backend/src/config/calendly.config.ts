import { registerAs } from '@nestjs/config';

export const calendlyConfig = registerAs('calendly', () => ({
  apiKey: process.env.CALENDLY_API_KEY,
  personalAccessToken: process.env.CALENDLY_PERSONAL_ACCESS_TOKEN,
  webhookSecret: process.env.CALENDLY_WEBHOOK_SECRET,
}));