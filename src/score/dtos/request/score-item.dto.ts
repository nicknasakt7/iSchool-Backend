import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class ScoreItemDto {
  @IsUUID()
  configId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value: number;
}
