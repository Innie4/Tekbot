import { Controller, Post, Body } from '@nestjs/common';
import { OpenAIService } from './openai.service';

@Controller('openai')
export class AiController {
  constructor(private readonly openAIService: OpenAIService) {}

  @Post('chat')
  async chat(@Body('messages') messages: Array<{ role: string; content: string }>) {
    const reply = await this.openAIService.getChatResponse(messages);
    return { reply };
  }
}
