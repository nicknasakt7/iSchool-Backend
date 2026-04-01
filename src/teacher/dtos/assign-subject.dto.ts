import { IsUUID } from 'class-validator';

export class AssignSubjectDto {
  @IsUUID('4')
  subjectId: string;

  @IsUUID('4')
  classId: string;
}
