import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Gender } from 'src/database/generated/prisma/enums';

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;
}
