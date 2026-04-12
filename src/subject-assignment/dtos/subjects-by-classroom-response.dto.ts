import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class SubjectInAssignmentDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

@Exclude()
export class SubjectsByClassroomResponseDto {
  @Expose()
  id: string;

  @Expose()
  subjectId: string;

  @Expose()
  @Type(() => SubjectInAssignmentDto)
  subject: SubjectInAssignmentDto;
}
