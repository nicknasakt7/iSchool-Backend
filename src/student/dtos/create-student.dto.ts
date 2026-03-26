import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

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

  @IsUUID()
  classId: string;

  @IsString()
  @IsOptional()
  healthNote: string;

  @IsString()
  @IsOptional()
  favorite: string;
}
