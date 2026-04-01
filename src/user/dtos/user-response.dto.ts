import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { TeacherProfileDto } from './teacher-profile.dto';
import { ParentProfileDto } from './parent-profile.dto';
import { Gender, Role } from 'src/database/generated/prisma/enums';

@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty({ enum: Role })
  role: Role;

  @Expose()
  @ApiProperty({ enum: Gender })
  gender: Gender;

  @Expose()
  @ApiProperty({ required: false })
  profileImageUrl?: string;

  @Expose()
  @ApiProperty({ required: false, type: TeacherProfileDto })
  @Type(() => TeacherProfileDto)
  teacher?: TeacherProfileDto;

  @Expose()
  @ApiProperty({ required: false, type: ParentProfileDto })
  @Type(() => ParentProfileDto)
  parent?: ParentProfileDto;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
