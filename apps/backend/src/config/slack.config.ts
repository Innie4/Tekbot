import { registerAs } from '@nestjs/config';

export const slackConfig = registerAs('slack', () => ({
  botToken: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
}));