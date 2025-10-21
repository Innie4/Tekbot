import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

@Injectable()
export class OpenAIService {
  constructor(private readonly configService: ConfigService) {}

  async getChatResponse(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const baseURL =
      this.configService.get<string>('OPENAI_BASE_URL') ||
      'https://api.openai.com/v1';
    const model =
      this.configService.get<string>('OPENAI_MODEL') ||
      this.configService.get<string>('openai.models.chat.default') ||
      'gpt-4';

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });
    if (!response.ok) throw new Error('OpenAI API error');
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
