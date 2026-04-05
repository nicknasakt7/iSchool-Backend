import { Type } from 'class-transformer';
import { IsInt, IsUUID, Min, Max } from 'class-validator';

export class GetConfigQueryDto {
  @IsUUID()
  classroomId: string;

  @IsUUID()
  subjectId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  term: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
