import { IsEmail, IsOptional, IsString } from 'class-validator';

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
  tel?: string | null;

  @IsOptional()
  @IsString()
  lineId?: string | null;
}
