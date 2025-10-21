import { Module } from '@nestjs/common';
import { EmailNotificationService } from './email-notification.service';

@Module({
  imports: [],
  controllers: [],
  providers: [EmailNotificationService],
  exports: [EmailNotificationService],
})
export class NotificationsModule {}
