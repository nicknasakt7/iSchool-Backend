import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  @IsNotEmpty()
  parentFirstName: string;

  @IsString()
  @IsNotEmpty()
  parentLastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  tel?: string;

  @IsString()
  @IsNotEmpty()
  studentFirstName: string;

  @IsString()
  @IsNotEmpty()
  studentLastName: string;

  @IsUUID()
  gradeId: string;
}
