import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';

@Injectable()
export class OpenAIService {
  constructor(private readonly configService: ConfigService) {}

  async getChatResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
      }),
    });
    if (!response.ok) throw new Error('OpenAI API error');
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}
