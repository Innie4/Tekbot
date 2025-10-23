import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OpenAIService {
  constructor(private readonly configService: ConfigService) {}

  async getChatResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const baseURL = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    const model =
      this.configService.get<string>('OPENAI_MODEL') ||
      this.configService.get<string>('openai.models.chat.default') ||
      'gpt-4';

    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const response = await axios.post(`${baseURL}/chat/completions`, {
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 30000, // 30 seconds timeout
      });

      return response.data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid OpenAI API key');
      } else if (error.response?.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      } else if (error.response?.status === 500) {
        throw new Error('OpenAI API server error');
      }
      
      throw new Error('Failed to get response from OpenAI');
    }
  }
}