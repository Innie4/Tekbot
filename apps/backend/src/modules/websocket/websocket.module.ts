import { Module, forwardRef } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { ConversationsModule } from '../conversations/conversations.module';
import { AiModule } from '../ai/ai.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    forwardRef(() => ConversationsModule),
    forwardRef(() => AiModule),
    forwardRef(() => CustomersModule),
  ],
  providers: [WebSocketGateway],
  exports: [WebSocketGateway],
})
export class WebSocketModule {}