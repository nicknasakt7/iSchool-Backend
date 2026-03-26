import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  studentCode: string;

  @IsString()
  @IsOptional()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName: string;

  @IsString()
  @IsOptional()
  nickName: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dob: Date;

  @IsUUID()
  @IsString()
  @IsOptional()
  parentId: string;

  @IsString()
  @IsOptional()
  healthNote: string;

  @IsString()
  @IsOptional()
  favorite: string;
}
