import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsAlphanumeric,
} from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';
import { Gender } from 'src/database/generated/prisma/enums';
import { BaseTeacherDto } from '../base/base-teacher.dto';

export class CreateTeacherDto extends BaseTeacherDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail()
  @Trim()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must contain at least 6 characters' })
  @IsAlphanumeric('en-US', {
    message: 'Password must contain only letters and numbers',
  })
  @Trim()
  password: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  gender: Gender;
}
