import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetaService {
  constructor(private readonly configService: ConfigService) {}

  async sendInstagramMessage(recipientId: string, message: string) {
    // TODO: Implement Meta API call
    return axios.post('https://graph.facebook.com/v17.0/me/messages', {
      recipient: { id: recipientId },
      message: { text: message },
      access_token: this.configService.get<string>('META_ACCESS_TOKEN'),
    });
  }

  verifyWebhook(req: any): boolean {
    // Meta webhooks use a verification token for GET and app secret for POST
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const expectedToken = this.configService.get<string>('META_VERIFY_TOKEN');
    if (mode && token && mode === 'subscribe' && token === expectedToken) {
      return true;
    }
    return false;
  }

  // TODO: Add webhook, authentication, FB Messenger logic
}
