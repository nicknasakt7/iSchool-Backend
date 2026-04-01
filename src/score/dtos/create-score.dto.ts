import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateScoreDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsNumber()
  @IsNotEmpty()
  term: number;

  @IsNumber()
  @IsNotEmpty()
  year: number;

  @IsNumber()
  @IsNotEmpty()
  totalScore: number;
}
