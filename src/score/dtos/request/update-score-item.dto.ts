import { Type } from 'class-transformer';
import { IsNumber, IsUUID, Min } from 'class-validator';

export class UpdateScoreItemDto {
  @IsUUID()
  configId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value: number;
}
