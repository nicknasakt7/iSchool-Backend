import { Injectable } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { Trend, RiskLevel } from 'src/database/generated/prisma/enums';

export type GeminiInsightResult = {
  summary: string;
  strength: string;
  weakness: string;
  suggestion: string;
  trend: Trend;
  riskLevel: RiskLevel;
};

const FALLBACK_INSIGHT: GeminiInsightResult = {
  summary: 'ไม่สามารถวิเคราะห์ข้อมูลได้',
  strength: '-',
  weakness: '-',
  suggestion: '-',
  trend: Trend.STABLE,
  riskLevel: RiskLevel.MEDIUM,
};

@Injectable()
export class GeminiService {
  private ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  async generateClassInsight(prompt: string): Promise<GeminiInsightResult> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      // 🔥 กัน undefined
      const text = response.text ?? '';

      return this.safeParseInsight(text);
    } catch (error) {
      console.error('Gemini error:', error);
      return FALLBACK_INSIGHT;
    }
  }

  private safeParseInsight(text: string): GeminiInsightResult {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return FALLBACK_INSIGHT;

      const parsed = JSON.parse(match[0]) as {
        summary?: string;
        strength?: string;
        weakness?: string;
        suggestion?: string;
        trend?: Trend;
        riskLevel?: RiskLevel;
      };

      return {
        summary: parsed.summary ?? FALLBACK_INSIGHT.summary,
        strength: parsed.strength ?? FALLBACK_INSIGHT.strength,
        weakness: parsed.weakness ?? FALLBACK_INSIGHT.weakness,
        suggestion: parsed.suggestion ?? FALLBACK_INSIGHT.suggestion,
        trend: Object.values(Trend).includes(parsed.trend as Trend)
          ? (parsed.trend as Trend)
          : FALLBACK_INSIGHT.trend,
        riskLevel: Object.values(RiskLevel).includes(
          parsed.riskLevel as RiskLevel,
        )
          ? (parsed.riskLevel as RiskLevel)
          : FALLBACK_INSIGHT.riskLevel,
      };
    } catch (error) {
      console.error('Parse error:', error);
      return FALLBACK_INSIGHT;
    }
  }
}
