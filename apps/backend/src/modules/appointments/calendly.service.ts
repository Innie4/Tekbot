import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CalendlyService {
  constructor(private readonly configService: ConfigService) {}

  async getEvents() {
    const apiKey = this.configService.get<string>('CALENDLY_API_KEY');
    return axios.get('https://api.calendly.com/scheduled_events', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }

  verifyWebhook(req: any): boolean {
    const calendlySignature = req.headers['calendly-webhook-signature'];
    const secret = this.configService.get<string>('CALENDLY_WEBHOOK_SECRET');
    return calendlySignature === secret;
  }

  // TODO: Add webhook, booking, event sync logic
}
