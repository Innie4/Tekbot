import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    // Mock email service for now
    this.logger.log(`Sending email to ${to}: ${subject}`);
    
    // In a real implementation, you would use nodemailer or another email service
    // For now, just log the email
    console.log('Email Details:', {
      to,
      subject,
      html,
    });
  }
}