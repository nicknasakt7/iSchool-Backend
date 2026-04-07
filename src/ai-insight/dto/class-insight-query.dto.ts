import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class ClassInsightQueryDto {
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
