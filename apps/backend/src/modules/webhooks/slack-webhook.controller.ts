import { Controller, Post, Req, Inject } from '@nestjs/common';
import { SlackService } from '../notifications/slack.service';

@Controller('webhooks/slack')
export class SlackWebhookController {
  constructor(
    @Inject(SlackService)
    private readonly slackService: SlackService,
  ) {}

  @Post('notifications')
  handleNotifications(@Req() req) {
    if (!this.slackService.verifyWebhook(req)) {
      return { received: false, error: 'Invalid signature' };
    }
    const event = req.body;
    if (event.type === 'event_callback' && event.event.type === 'message') {
      // Handle Slack message event
      // ...business logic here...
    }
    return { received: true };
  }
}
