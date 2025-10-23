import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('email')
  async sendEmail(@Body() body: { to: string; subject: string; html: string }) {
    return this.notificationService.sendEmail({
      to: body.to,
      subject: body.subject,
      html: body.html,
    });
  }

  @Post('sms')
  async sendSms(@Body() body: { to: string; message: string }) {
    return this.notificationService.sendSms({
      to: body.to,
      body: body.message,
    });
  }

  @Post('slack')
  async sendSlack(@Body() body: { channel: string; text: string }) {
    return this.notificationService.sendSlack({
      channel: body.channel,
      text: body.text,
    });
  }

  @Post('in-app')
  async sendInApp(
    @Body()
    body: {
      userId: string;
      tenantId: string;
      title: string;
      message: string;
      type:
        | 'info'
        | 'success'
        | 'warning'
        | 'error'
        | 'message_received'
        | 'appointment_reminder'
        | 'payment_confirmation';
    },
  ) {
    return this.notificationService.sendInApp({
      userId: body.userId,
      tenantId: body.tenantId,
      title: body.title,
      message: body.message,
      type: body.type,
    });
  }
}
