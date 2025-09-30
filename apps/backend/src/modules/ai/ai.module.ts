import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { OpenAIService } from './openai.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class AiModule {}