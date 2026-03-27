import { IsInt, IsString } from 'class-validator';

export class CreateGradeDto {
  @IsString()
  name: string;

  @IsInt()
  level: number;
}
