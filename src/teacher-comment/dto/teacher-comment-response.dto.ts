import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TeacherCommentResponseDto {
  @Expose()
  id: string;

  @Expose()
  studentId: string;

  @Expose()
  subjectId: string;

  @Expose()
  teacherId: string;

  @Expose()
  term: number;

  @Expose()
  year: number;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
