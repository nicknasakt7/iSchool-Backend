import { IsUUID } from 'class-validator';

export class FindAssignmentQueryDto {
  @IsUUID()
  classroomId: string;

  @IsUUID()
  subjectId: string;
}
