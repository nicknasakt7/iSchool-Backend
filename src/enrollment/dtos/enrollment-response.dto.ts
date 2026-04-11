import { Exclude, Expose, Type } from 'class-transformer';
import { EnrollmentStatus } from 'src/database/generated/prisma/enums';

@Exclude()
class EnrollmentStudentDto {
  @Expose() id: string;
  @Expose() studentCode: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() nickName: string;
  @Expose() profileImageUrl: string | null;
}

@Exclude()
class EnrollmentGradeDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() level: number;
}

@Exclude()
class EnrollmentClassroomDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() year: number | null;
  @Expose() term: number | null;
}

@Exclude()
export class EnrollmentResponseDto {
  @Expose() id: string;
  @Expose() studentId: string;
  @Expose() gradeId: string;
  @Expose() classroomId: string | null;
  @Expose() year: number;
  @Expose() term: number;
  @Expose() status: EnrollmentStatus;
  @Expose() startDate: Date | null;
  @Expose() endDate: Date | null;
  @Expose() createdAt: Date;

  @Expose()
  @Type(() => EnrollmentStudentDto)
  student: EnrollmentStudentDto;

  @Expose()
  @Type(() => EnrollmentGradeDto)
  grade: EnrollmentGradeDto;

  @Expose()
  @Type(() => EnrollmentClassroomDto)
  classroom: EnrollmentClassroomDto | null;
}

@Exclude()
export class PromoteResultDto {
  @Expose() promoted: number;
  @Expose() skipped: number;

  @Expose()
  @Type(() => EnrollmentResponseDto)
  results: EnrollmentResponseDto[];

  @Expose()
  skippedStudentIds: string[];
}
