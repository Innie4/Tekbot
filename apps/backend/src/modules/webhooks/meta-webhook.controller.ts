import {
  Controller,
  Post,
  Get,
  Req,
  Inject,
  SetMetadata,
} from '@nestjs/common';
import { MetaService } from '../messaging/meta.service';

@Controller('webhooks/meta')
@SetMetadata('skipThrottle', true)
export class MetaWebhookController {
  constructor(
    @Inject(MetaService)
    private readonly metaService: MetaService,
  ) {}

  @Get('messages')
  verifyWebhook(@Req() req) {
    if (this.metaService.verifyWebhook(req)) {
      return req.query['hub.challenge'];
    }
    return 'Verification failed';
  }

  @Post('messages')
  handleMessages(@Req() req) {
    // Meta webhook POST event
    // ...business logic here...
    return { received: true };
  }
}
