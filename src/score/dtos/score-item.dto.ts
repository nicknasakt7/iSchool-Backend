import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Max, Min } from 'class-validator';

export class ScoreItemInput {
  @IsUUID()
  configId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  value: number;
}
