import {
  IsAlphanumeric,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateScoreDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsAlphanumeric()
  @IsNotEmpty()
  term: number;

  @IsAlphanumeric()
  @IsNotEmpty()
  year: number;

  @IsNumber()
  @IsNotEmpty()
  totalScore: number;
}
