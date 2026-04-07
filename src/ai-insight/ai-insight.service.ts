import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { GeminiService } from './gemini.service';
import { AppException } from 'src/common/exceptions/app-exception';
import { AIClassAnalysisResponseDto } from './dto/response/ai-class-analysis-response.dto';

@Injectable()
export class AiInsightService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiService: GeminiService,
  ) {}

  // ==============================
  // GET EXISTING INSIGHT
  // ==============================
  async getClassInsight(
    classroomId: string,
    term: number,
    year: number,
  ): Promise<AIClassAnalysisResponseDto | null> {
    const existing = await this.prisma.aIClassAnalysis.findUnique({
      where: { classroomId_term_year: { classroomId, term, year } },
    });

    return existing ?? null;
  }

  // ==============================
  // GENERATE (OR RETURN CACHED) INSIGHT
  // ==============================
  async generateClassInsight(
    classroomId: string,
    term: number,
    year: number,
    userId: string,
  ) {
    // 1. Return cached insight if already generated for this term/year
    const existing = await this.prisma.aIClassAnalysis.findUnique({
      where: { classroomId_term_year: { classroomId, term, year } },
    });
    if (existing) return existing;

    // 2. Resolve teacher profile from authenticated userId
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      throw new AppException(
        'Teacher profile not found',
        'TEACHER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    // 3. Fetch classroom with students and their scores for this term/year
    const classroom = await this.prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        students: {
          where: { deletedAt: null },
          include: {
            scores: { where: { term, year } },
          },
        },
      },
    });
    if (!classroom) {
      throw new AppException(
        'Classroom not found',
        'CLASSROOM_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    const students = classroom.students;
    if (students.length === 0) {
      throw new AppException(
        'No students found in this classroom',
        'NO_STUDENTS',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 4. Aggregate scores
    const allScores = students.flatMap((s) =>
      s.scores.map((sc) => sc.totalScore),
    );

    const avg =
      allScores.length > 0
        ? Math.round(
            (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10,
          ) / 10
        : 0;

    const submissionRate = 94; // mocked

    // 5. Advanced stats: top 3 / bottom 3
    const sorted = [...allScores].sort((a, b) => b - a);
    const topScores = sorted.slice(0, 3);
    const bottomScores = sorted.slice(-3).reverse();

    // 6. Build Gemini prompt
    const prompt = `
You are an educational data analyst. Analyze the following class performance data and return a STRICT JSON object — no markdown, no code blocks, no extra text, only raw JSON.

Class data:
- Total students: ${students.length}
- Term: ${term}, Year: ${year}
- Average score: ${avg}
- Submission rate: ${submissionRate}%
- Top 3 scores: ${JSON.stringify(topScores)}
- Bottom 3 scores: ${JSON.stringify(bottomScores)}
- All scores: ${JSON.stringify(allScores)}

Return this exact JSON structure:
{
  "summary": "brief 1-2 sentence class performance summary in Thai",
  "strength": "main strength observed in Thai",
  "weakness": "main weakness observed in Thai",
  "suggestion": "actionable suggestion for the teacher in Thai",
  "trend": "IMPROVED" or "DECLINED" or "STABLE",
  "riskLevel": "LOW" or "MEDIUM" or "HIGH"
}

Rules:
- trend: IMPROVED if avg >= 75, DECLINED if avg < 60, otherwise STABLE
- riskLevel: HIGH if avg < 60, MEDIUM if avg < 75, LOW if avg >= 75
- All text fields must be in Thai
- Return ONLY the raw JSON object, nothing else
    `.trim();

    // 7. Call Gemini
    const insight = await this.geminiService.generateClassInsight(prompt);

    // 8. Upsert to database (safe re-run if race condition occurs)
    const saved = await this.prisma.aIClassAnalysis.upsert({
      where: { classroomId_term_year: { classroomId, term, year } },
      create: {
        classroomId,
        teacherId: teacher.id,
        term,
        year,
        summary: insight.summary,
        strength: insight.strength,
        weakness: insight.weakness,
        suggestion: insight.suggestion,
        trend: insight.trend,
        riskLevel: insight.riskLevel,
      },
      update: {
        teacherId: teacher.id,
        summary: insight.summary,
        strength: insight.strength,
        weakness: insight.weakness,
        suggestion: insight.suggestion,
        trend: insight.trend,
        riskLevel: insight.riskLevel,
      },
    });

    return { ...saved, avg, submissionRate };
  }
}
