import { IsString } from 'class-validator';

export class AssignSubjectDto {
  @IsString()
  teacherId: string;

  @IsString()
  subjectId: string;

  @IsString()
  classId: string;
}
