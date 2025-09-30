import { Controller, Post, Req, Inject } from '@nestjs/common';
import { CalendlyService } from '../appointments/calendly.service';

@Controller('webhooks/calendly')
export class CalendlyWebhookController {
  constructor(
    @Inject(CalendlyService)
    private readonly calendlyService: CalendlyService,
  ) {}

  @Post('events')
  handleEvents(@Req() req) {
    if (!this.calendlyService.verifyWebhook(req)) {
      return { received: false, error: 'Invalid signature' };
    }
    const event = req.body;
    if (event.event === 'invitee.created') {
      // Handle new booking
      // ...business logic here...
    }
    return { received: true };
  }
}
