import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender } from 'src/database/generated/prisma/enums';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  studentCode: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  nickName: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dob: Date;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;

  @IsUUID()
  @IsNotEmpty()
  gradeId: string;

  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  classId: string;

  @IsUUID()
  @IsNotEmpty()
  @IsOptional()
  parentId: string;

  @IsString()
  @IsOptional()
  healthNote: string;

  @IsString()
  @IsOptional()
  favorite: string;
}
