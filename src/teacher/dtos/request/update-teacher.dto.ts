import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { PartialType, PickType } from '@nestjs/swagger';
import { BaseTeacherDto } from '../base/base-teacher.dto';
import { Gender } from 'src/database/generated/prisma/enums';

class UpdateTeacherBaseDto extends PartialType(
  PickType(BaseTeacherDto, ['firstName', 'lastName', 'homeroomClassId'] as const),
) {}

export class UpdateTeacherDto extends UpdateTeacherBaseDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
