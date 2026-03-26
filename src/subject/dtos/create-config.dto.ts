import { IsInt, IsString, Min } from 'class-validator';

export class CreateConfigDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  maxScore: number;

  @IsInt()
  order: number;
}
