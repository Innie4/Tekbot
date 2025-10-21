import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';
import * as crypto from 'crypto';

@Injectable()
export class SlackService {
  private client: WebClient;
  constructor(private readonly configService: ConfigService) {
    this.client = new WebClient(configService.get<string>('SLACK_BOT_TOKEN'));
  }

  async sendMessage(channel: string, text: string) {
    return this.client.chat.postMessage({ channel, text });
  }

  verifyWebhook(req: any): boolean {
    const slackSignature = req.headers['x-slack-signature'];
    const slackTimestamp = req.headers['x-slack-request-timestamp'];
    const secret = this.configService.get<string>('SLACK_SIGNING_SECRET');
    const sigBasestring = `v0:${slackTimestamp}:${req.rawBody || JSON.stringify(req.body)}`;
    const mySignature =
      'v0=' +
      crypto.createHmac('sha256', secret).update(sigBasestring).digest('hex');
    return mySignature === slackSignature;
  }

  // TODO: Add webhook, notification, bot logic
}
