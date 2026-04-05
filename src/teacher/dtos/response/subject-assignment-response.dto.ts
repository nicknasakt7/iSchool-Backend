import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SubjectAssignmentResponseDto {
  @Expose()
  id: string;

  @Expose()
  teacherId: string;

  @Expose()
  subjectId: string;

  @Expose()
  classId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  subjectName?: string | null;

  @Expose()
  className?: string | null;
}
