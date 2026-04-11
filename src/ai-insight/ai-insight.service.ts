import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { GeminiService } from './gemini.service';
import { AppException } from 'src/common/exceptions/app-exception';
import { AIClassAnalysisResponseDto } from './dto/response/ai-class-analysis-response.dto';
import { AIStudentAnalysisResponseDto } from './dto/response/ai-student-analysis-response.dto';

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
    userRole: string,
  ) {
    // 1. Resolve teacher profile — ADMIN/SUPER_ADMIN may not have a teacher profile
    const isAdminRole = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher && !isAdminRole) {
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
        homeroomTeacher: { take: 1 },
      },
    });
    if (!classroom) {
      throw new AppException(
        'Classroom not found',
        'CLASSROOM_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    // Fallback: ADMIN/SUPER_ADMIN may not have a teacher profile — use homeroom teacher
    const resolvedTeacher = teacher ?? classroom.homeroomTeacher[0] ?? null;
    if (!resolvedTeacher) {
      throw new AppException(
        'No teacher associated with this classroom',
        'TEACHER_NOT_FOUND',
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

    // Students who have at least one score record for this term/year
    const studentsWithScores = students.filter(
      (s) => s.scores.length > 0,
    ).length;
    const submissionRate =
      students.length > 0
        ? Math.round((studentsWithScores / students.length) * 100)
        : 0;

    // 5. Advanced stats: top 3 / bottom 3
    const sorted = [...allScores].sort((a, b) => b - a);
    const topScores = sorted.slice(0, 3);
    const bottomScores = sorted.slice(-3).reverse();

    // 6. Fetch teacher comments for all students in this classroom for this term/year
    const studentIds = students.map((s) => s.id);
    const teacherComments = await this.prisma.teacherComment.findMany({
      where: {
        studentId: { in: studentIds },
        term,
        year,
        deletedAt: null,
      },
      select: { content: true },
    });
    const commentTexts = teacherComments.map((c) => c.content);

    // 7. Build Gemini prompt
    const commentSection =
      commentTexts.length > 0
        ? `- Teacher comments on students (${commentTexts.length} total): ${JSON.stringify(commentTexts)}`
        : '- Teacher comments: none recorded for this term';

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
${commentSection}

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
- Use the teacher comments to enrich the analysis where relevant
- Return ONLY the raw JSON object, nothing else
    `.trim();

    // 7. Call Gemini
    const insight = await this.geminiService.generateClassInsight(prompt);

    // 8. Upsert to database (safe re-run if race condition occurs)
    const saved = await this.prisma.aIClassAnalysis.upsert({
      where: { classroomId_term_year: { classroomId, term, year } },
      create: {
        classroomId,
        teacherId: resolvedTeacher.id,
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
        teacherId: resolvedTeacher.id,
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

  // ==============================
  // GET EXISTING STUDENT INSIGHT
  // ==============================
  async getStudentInsight(
    studentId: string,
    term: number,
    year: number,
  ): Promise<AIStudentAnalysisResponseDto | null> {
    const existing = await this.prisma.aIStudentAnalysis.findUnique({
      where: { studentId_term_year: { studentId, term, year } },
    });

    return existing ?? null;
  }

  // ==============================
  // GENERATE (OR UPDATE) STUDENT INSIGHT
  // ==============================
  async generateStudentInsight(
    studentId: string,
    term: number,
    year: number,
    userId: string,
    userRole: string,
  ): Promise<AIStudentAnalysisResponseDto> {
    // 1. Resolve teacher — ADMIN/SUPER_ADMIN อาจไม่มี teacher profile
    const isAdminRole = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher && !isAdminRole) {
      throw new AppException(
        'Teacher profile not found',
        'TEACHER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    // 2. Fetch student พร้อม scores และ comments ของ term/year นี้
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      include: {
        scores: {
          where: { term, year },
          include: { subject: true },
        },
        comments: {
          where: { term, year, deletedAt: null },
          include: { subject: true },
        },
        grade: true,
        classroom: true,
      },
    });

    if (!student) {
      throw new AppException(
        'Student not found',
        'STUDENT_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    // 3. Fallback teacher — ADMIN ใช้ homeroom teacher ของ classroom นักเรียน
    let resolvedTeacher = teacher;
    if (!resolvedTeacher && student.classId) {
      resolvedTeacher = await this.prisma.teacher.findFirst({
        where: { homeroomClassId: student.classId },
      });
    }

    if (!resolvedTeacher) {
      throw new AppException(
        'No teacher available to generate insight',
        'TEACHER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    // 4. เตรียมข้อมูลสำหรับ prompt
    const scoreData = student.scores.map((s) => ({
      subject: s.subject.name,
      totalScore: s.totalScore,
    }));

    const allScores = student.scores.map((s) => s.totalScore);
    const avg =
      allScores.length > 0
        ? Math.round(
            (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10,
          ) / 10
        : 0;

    const commentTexts = student.comments.map((c) => c.content);

    const scoreSection =
      scoreData.length > 0
        ? `- Scores: ${JSON.stringify(scoreData)}\n- Average score: ${avg}`
        : '- No scores recorded for this term';

    const commentSection =
      commentTexts.length > 0
        ? `- Teacher comments (${commentTexts.length}): ${JSON.stringify(commentTexts)}`
        : '- Teacher comments: none recorded for this term';

    // 5. Build Gemini prompt
    const prompt = `
You are an educational data analyst. Analyze the following individual student performance data and return a STRICT JSON object — no markdown, no code blocks, no extra text, only raw JSON.

Student data:
- Name: ${student.firstName} ${student.lastName}
- Grade: ${student.grade?.name ?? 'N/A'}
- Classroom: ${student.classroom?.name ?? 'N/A'}
- Term: ${term}, Year: ${year}
${scoreSection}
${commentSection}

Return this exact JSON structure:
{
  "summary": "brief 1-2 sentence individual performance summary in Thai",
  "strength": "main strength observed in Thai",
  "weakness": "main weakness or area to improve in Thai",
  "suggestion": "actionable suggestion for the teacher in Thai",
  "trend": "IMPROVED" or "DECLINED" or "STABLE",
  "riskLevel": "LOW" or "MEDIUM" or "HIGH"
}

Rules:
- trend: IMPROVED if avg >= 75, DECLINED if avg < 60, otherwise STABLE
- riskLevel: HIGH if avg < 60, MEDIUM if avg < 75, LOW if avg >= 75
- All text fields must be in Thai
- Use teacher comments to enrich the analysis where relevant
- Return ONLY the raw JSON object, nothing else
    `.trim();

    // 6. Call Gemini
    const insight = await this.geminiService.generateClassInsight(prompt);

    // 7. Upsert ผลลัพธ์ลง DB (safe re-run)
    return this.prisma.aIStudentAnalysis.upsert({
      where: { studentId_term_year: { studentId, term, year } },
      create: {
        studentId,
        teacherId: resolvedTeacher.id,
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
        teacherId: resolvedTeacher.id,
        summary: insight.summary,
        strength: insight.strength,
        weakness: insight.weakness,
        suggestion: insight.suggestion,
        trend: insight.trend,
        riskLevel: insight.riskLevel,
      },
    });
  }
}
