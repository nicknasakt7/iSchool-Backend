import {
  IsAlphanumeric,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { Gender, Role } from 'src/database/generated/prisma/enums';

export class CreateUserDto {
  @IsEmail()
  @IsString()
  @IsNotEmpty()
  email: string;

  @MinLength(6)
  @IsAlphanumeric()
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;
}
