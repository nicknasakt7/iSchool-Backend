import { Exclude, Expose, Type } from 'class-transformer';
import { ScoreItemResponseDto } from './score-item-response.dto';

@Exclude()
export class ScoreResponseDto {
  @Expose()
  id: string;

  @Expose()
  studentId: string;

  @Expose()
  subjectId: string;

  @Expose()
  term: number;

  @Expose()
  year: number;

  @Expose()
  totalScore: number;

  @Expose()
  subjectGrade: number;

  @Expose()
  @Type(() => ScoreItemResponseDto)
  items: ScoreItemResponseDto[];
}
