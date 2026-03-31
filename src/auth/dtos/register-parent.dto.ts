import { IsEmail, IsString, IsOptional } from 'class-validator';

export class RegisterParentDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  tel?: string;

  @IsOptional()
  @IsString()
  lineId?: string;

  @IsString()
  token: string;
}
