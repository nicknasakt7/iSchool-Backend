import { IsString, IsOptional } from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  userId: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  homeroomClassId?: string;
}
