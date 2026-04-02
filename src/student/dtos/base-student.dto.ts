import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDate,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
import { Gender } from 'src/database/generated/prisma/enums';

export class BaseStudentDto {
  @IsOptional()
  @IsString()
  studentCode?: string;

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
  gender: Gender;

  @IsString()
  @IsNotEmpty()
  parentsFirstName: string;

  @IsString()
  @IsNotEmpty()
  parentsLastName: string;

  @IsEmail()
  @IsNotEmpty()
  parentsEmail: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  profileImagePublicId?: string;

  @IsOptional()
  @IsString()
  healthNote?: string;

  @IsOptional()
  @IsString()
  favorite?: string;

  @IsUUID()
  @IsNotEmpty()
  gradeId: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
