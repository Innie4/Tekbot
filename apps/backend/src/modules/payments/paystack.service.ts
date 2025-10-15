import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackService {
  private baseUrl = 'https://api.paystack.co';
  constructor(private readonly configService: ConfigService) {}

  async initializeTransaction(amountNaira: number, email: string) {
    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    const amountKobo = Math.round(amountNaira * 100);
    return axios.post(`${this.baseUrl}/transaction/initialize`, {
      amount: amountKobo,
      email,
    }, {
      headers: { Authorization: `Bearer ${secret}` },
    });
  }

  verifyWebhook(req: any): boolean {
    const paystackSignature = req.headers['x-paystack-signature'];
    const secret = this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET');
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
    return hash === paystackSignature;
  }

  // TODO: Add more Paystack logic (webhooks, verification, etc.)
}
