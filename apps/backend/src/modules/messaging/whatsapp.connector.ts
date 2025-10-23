import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class WhatsAppConnector {
  private client: Twilio;

  constructor() {
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );
  }

  async sendMessage(to: string, body: string) {
    return this.client.messages.create({
      from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER,
      to: 'whatsapp:' + to,
      body,
    });
  }

  // TODO: Add webhook handler for incoming WhatsApp messages
}
