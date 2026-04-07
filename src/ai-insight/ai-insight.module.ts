import { Module } from '@nestjs/common';
import { AiInsightController } from './ai-insight.controller';
import { AiInsightService } from './ai-insight.service';
import { GeminiService } from './gemini.service';

@Module({
  controllers: [AiInsightController],
  providers: [AiInsightService, GeminiService],
})
export class AiInsightModule {}
