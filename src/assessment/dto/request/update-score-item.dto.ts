import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class UpdateScoreItemDto {
  @IsUUID()
  scoreItemId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value: number;
}
