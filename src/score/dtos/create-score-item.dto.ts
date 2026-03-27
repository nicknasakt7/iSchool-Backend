import { IsAlphanumeric, IsNotEmpty, IsString } from 'class-validator';

export class CreateScoreItemDto {
  @IsString()
  @IsNotEmpty()
  configId: string;

  @IsAlphanumeric()
  @IsNotEmpty()
  value: number;

  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;
}
