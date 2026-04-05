import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AssessmentConfigResponseDto {
  @Expose()
  id: string;

  @Expose()
  subjectAssignmentId: string;

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
