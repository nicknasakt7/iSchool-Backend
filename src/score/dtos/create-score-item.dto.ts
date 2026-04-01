import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateScoreItemDto {
  @IsString()
  @IsNotEmpty()
  configId: string;

  @IsNumber()
  @IsNotEmpty()
  value: number;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;
}
