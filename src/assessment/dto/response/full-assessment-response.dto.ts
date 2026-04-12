import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class FullScoreItemDto {
  @Expose()
  scoreItemId: string;

  @Expose()
  configId: string;

  @Expose()
  value: number;
}

@Exclude()
export class StudentInFullAssessmentDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  nickName: string | null;

  @Expose()
  studentCode: string;

  @Expose()
  profileImageUrl: string | null;

  @Expose()
  scoreId: string | null;

  @Expose()
  totalScore: number;

  @Expose()
  subjectGrade: number;

  @Expose()
  @Type(() => FullScoreItemDto)
  scores: FullScoreItemDto[];
}

@Exclude()
export class FullAssessmentConfigDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  maxScore: number;

  @Expose()
  order: number;

  @Expose()
  term: number;

  @Expose()
  year: number;
}

@Exclude()
export class FullAssessmentResponseDto {
  @Expose()
  @Type(() => FullAssessmentConfigDto)
  configs: FullAssessmentConfigDto[];

  @Expose()
  @Type(() => StudentInFullAssessmentDto)
  students: StudentInFullAssessmentDto[];
}
