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
  profileImageUrl?: string | null;

  @Expose()
  profileImagePublicId?: string | null;

  @Expose()
  healthNote?: string | null;

  @Expose()
  favorite?: string | null;

  @Expose()
  gradeId: string;

  @Expose()
  classId?: string | null;

  @Expose()
  parentId?: string | null;

  @Expose()
  @Type(() => GradeResponseDto)
  grade?: GradeResponseDto | null;

  @Expose()
  @Type(() => ParentResponseDto)
  parent?: ParentResponseDto | null;

  @Expose()
  @Type(() => ClassroomResponseDto)
  classroom?: ClassroomResponseDto | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
