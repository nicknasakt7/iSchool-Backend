import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDate,
  IsNotEmpty,
} from 'class-validator';
import { Gender } from 'src/database/generated/prisma/enums';

export class BaseStudentDto {
  @IsOptional() // ไม่ require เพราะจะ generate เอง
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

  @IsOptional()
  @IsString()
  healthNote?: string;

  @IsOptional()
  @IsString()
  favorite?: string;

  @IsUUID()
  gradeId: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
