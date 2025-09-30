import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class SmtpService {
  private transporter: nodemailer.Transporter;
  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('SMTP_HOST'),
      port: configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: configService.get<string>('SMTP_USER'),
        pass: configService.get<string>('SMTP_PASS'),
      },
    });
  }

  getTemplate(type: string, params: Record<string, any>): { subject: string; html: string } {
    switch (type) {
      case 'welcome':
        return {
          subject: 'Welcome to TekAssist!',
          html: `<h1>Hello ${params.name},</h1><p>Welcome to TekAssist!</p>`,
        };
      case 'reset':
        return {
          subject: 'Password Reset',
          html: `<p>Click <a href="${params.link}">here</a> to reset your password.</p>`,
        };
      default:
        return {
          subject: params.subject || 'Notification',
          html: params.html || '',
        };
    }
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      return await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM'),
        to,
        subject,
        html,
      });
    } catch (error) {
      // Log error, rethrow or handle as needed
      console.error('SMTP error:', error);
      throw new Error('Failed to send email');
    }
  }

  // TODO: Refine templates, enhance error handling
}
