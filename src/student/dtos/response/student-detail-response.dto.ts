import { Exclude, Expose, Type } from 'class-transformer';
import { ParentResponseDto } from 'src/parent/dtos/parent-response.dto';
import { ClassroomResponseDto } from 'src/classroom/dtos/classroom-response.dto';
import { GradeResponseDto } from 'src/classroom/dtos/grade-response.dto';
import { StudentResponseDto } from './student-response.dto';

// ========================
// Nested DTOs
// ========================

@Exclude()
export class SubjectInDetailDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

@Exclude()
export class TeacherInDetailDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;
}

@Exclude()
export class ScoreInDetailDto {
  @Expose()
  id: string;

  @Expose()
  subjectId: string;

  @Expose()
  totalScore: number;

  @Expose()
  subjectGrade: number;

  @Expose()
  term: number;

  @Expose()
  year: number;

  @Expose()
  @Type(() => SubjectInDetailDto)
  subject: SubjectInDetailDto;
}

@Exclude()
export class CommentInDetailDto {
  @Expose()
  id: string;

  @Expose()
  content: string;

  @Expose()
  subjectId: string;

  @Expose()
  teacherId: string;

  @Expose()
  term: number;

  @Expose()
  year: number;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => SubjectInDetailDto)
  subject: SubjectInDetailDto;

  @Expose()
  @Type(() => TeacherInDetailDto)
  teacher: TeacherInDetailDto;
}

@Exclude()
export class EnrollmentHistoryInDetailDto {
  @Expose()
  id: string;

  @Expose()
  year: number;

  @Expose()
  term: number;

  @Expose()
  status: string;

  @Expose()
  startDate: Date | null;

  @Expose()
  endDate: Date | null;

  @Expose()
  @Type(() => GradeResponseDto)
  grade: GradeResponseDto;

  @Expose()
  @Type(() => ClassroomResponseDto)
  classroom: ClassroomResponseDto | null;
}

// ========================
// Main DTO
// ========================

@Exclude()
export class StudentDetailResponseDto extends StudentResponseDto {
  @Expose()
  @Type(() => GradeResponseDto)
  declare grade?: GradeResponseDto | null;

  @Expose()
  @Type(() => ParentResponseDto)
  declare parent?: ParentResponseDto | null;

  @Expose()
  @Type(() => ClassroomResponseDto)
  declare classroom?: ClassroomResponseDto | null;

  @Expose()
  @Type(() => ScoreInDetailDto)
  scores: ScoreInDetailDto[];

  @Expose()
  @Type(() => CommentInDetailDto)
  comments: CommentInDetailDto[];

  @Expose()
  @Type(() => EnrollmentHistoryInDetailDto)
  studentEnrollments: EnrollmentHistoryInDetailDto[];
}
