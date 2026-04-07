import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class GetCommentQueryDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  subjectId: string;

  @IsInt()
  @Min(1)
  @Max(2)
  @Type(() => Number)
  term: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year: number;
}
