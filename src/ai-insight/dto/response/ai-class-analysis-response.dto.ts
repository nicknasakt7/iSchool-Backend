import { Exclude, Expose } from 'class-transformer';
import { Trend, RiskLevel } from 'src/database/generated/prisma/enums';

@Exclude()
export class AIClassAnalysisResponseDto {
  @Expose()
  id: string;

  @Expose()
  classroomId: string;

  @Expose()
  teacherId: string;

  @Expose()
  summary: string;

  @Expose()
  strength: string;

  @Expose()
  weakness: string;

  @Expose()
  suggestion: string;

  @Expose()
  trend: Trend;

  @Expose()
  riskLevel: RiskLevel;

  @Expose()
  term: number;

  @Expose()
  year: number;

  @Expose()
  generatedAt: Date;

  // computed fields (ไม่ได้อยู่ใน DB)
  @Expose()
  avg?: number | null;

  @Expose()
  submissionRate?: number | null;
}
