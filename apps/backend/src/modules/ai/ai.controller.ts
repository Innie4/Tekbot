import { Controller, Post, Body, Headers, Req } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('openai')
export class AiController {
  constructor(private readonly openAIService: OpenAIService) {}

  @Post('chat')
  @Public()
  async chat(
    @Body() body: { 
      message: string; 
      conversationId?: string; 
      sessionId?: string; 
      messages?: Array<{ role: string; content: string }> 
    },
    @Headers('x-tenant-id') tenantId?: string,
  ) {
    try {
      // Handle both widget format and direct messages format
      let messages: Array<{ role: string; content: string }>;
      
      if (body.messages) {
        messages = body.messages;
      } else if (body.message) {
        messages = [{ role: 'user', content: body.message }];
      } else {
        throw new Error('No message provided');
      }

      const reply = await this.openAIService.getChatResponse(messages);
      
      // Return format expected by widget
      return { 
        response: reply,
        message: reply,
        reply,
        conversationId: body.conversationId,
        sessionId: body.sessionId,
        messageId: `msg_${Date.now()}`,
        metadata: {
          tenantId,
          timestamp: new Date().toISOString(),
        }
      };
    } catch (error) {
      console.error('Chat error:', error);
      return {
        response: 'Sorry, I encountered an error. Please try again.',
        message: 'Sorry, I encountered an error. Please try again.',
        error: true,
        conversationId: body.conversationId,
        sessionId: body.sessionId,
      };
    }
  }
}
