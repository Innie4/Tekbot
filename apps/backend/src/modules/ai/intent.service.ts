import { Injectable } from '@nestjs/common';
import { OpenAIService } from './openai.service';

@Injectable()
export class IntentService {
  constructor(private readonly openAIService: OpenAIService) {}

  async classifyIntent(messages: Array<{ role: string; content: string }>): Promise<string> {
    // Use OpenAI to classify user intent
    const response = await this.openAIService.getChatResponse([
      { role: 'system', content: 'Classify the user intent. Only return the intent name.' },
      ...messages,
    ]);
    // Optionally parse/validate response
    return response.trim();
  }
}
