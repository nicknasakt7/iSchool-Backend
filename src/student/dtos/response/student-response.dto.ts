import { Exclude, Expose, Type } from 'class-transformer';
import { Gender } from 'src/database/generated/prisma/enums';
import { ParentResponseDto } from 'src/parent/dtos/parent-response.dto';
import { ClassroomResponseDto } from 'src/classroom/dtos/classroom-response.dto';
import { GradeResponseDto } from 'src/classroom/dtos/grade-response.dto';

@Exclude()
export class StudentResponseDto {
  @Expose()
  id: string;

  @Expose()
  studentCode: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  nickName: string;

  @Expose()
  dob: Date;

  @Expose()
  gender: Gender;

  @Expose()
  parentsFirstName: string;

  @Expose()
  parentsLastName: string;

  @Expose()
  parentsEmail: string;

  @Expose()
  profileImageUrl?: string;

  @Expose()
  profileImagePublicId?: string;

  @Expose()
  healthNote?: string;

  @Expose()
  favorite?: string;

  @Expose()
  gradeId: string;

  @Expose()
  classId?: string;

  @Expose()
  parentId?: string;

  @Expose()
  @Type(() => GradeResponseDto)
  grade?: GradeResponseDto;

  @Expose()
  @Type(() => ParentResponseDto)
  parent?: ParentResponseDto;

  @Expose()
  @Type(() => ClassroomResponseDto)
  classroom?: ClassroomResponseDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
