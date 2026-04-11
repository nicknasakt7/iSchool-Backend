import { Exclude, Expose } from 'class-transformer';
import { Trend, RiskLevel } from 'src/database/generated/prisma/enums';

@Exclude()
export class AIStudentAnalysisResponseDto {
  @Expose()
  id: string;

  @Expose()
  studentId: string;

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
  isLocked: boolean;

  @Expose()
  generatedAt: Date;
}
