import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SubjectAssignmentResponseDto {
  @Expose()
  id: string;

  @Expose()
  classId: string;

  @Expose()
  subjectId: string;
}
