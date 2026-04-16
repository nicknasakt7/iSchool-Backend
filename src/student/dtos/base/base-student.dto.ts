import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNotEmpty,
  IsEmail,
  IsDate,
} from 'class-validator';
import { ToLowerCase } from 'src/common/decorators/to-lowercase.decorator';
import { Trim } from 'src/common/decorators/trim.decorator';
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

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
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
  @Trim()
  @ToLowerCase()
  parentsEmail: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string | null;

  @IsOptional()
  @IsString()
  profileImagePublicId?: string | null;

  @IsOptional()
  @IsString()
  healthNote?: string | null;

  @IsOptional()
  @IsString()
  favorite?: string | null;

  @IsUUID()
  @IsNotEmpty()
  gradeId: string;

  @IsOptional()
  @IsUUID()
  classId?: string | null;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
