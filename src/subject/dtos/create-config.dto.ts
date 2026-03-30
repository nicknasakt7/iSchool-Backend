import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateConfigDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  @IsNotEmpty()
  maxScore: number;

  @IsInt()
  @IsNotEmpty()
  order: number;

  @IsInt()
  term: number;

  @IsInt()
  year: number;
}
