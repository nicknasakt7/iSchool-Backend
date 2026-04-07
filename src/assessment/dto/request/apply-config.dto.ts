import { IsInt, IsUUID, Min, Max } from 'class-validator';

export class ApplyConfigDto {
  @IsUUID()
  subjectAssignmentId: string;

  @IsUUID()
  classroomId: string;

  @IsUUID()
  subjectId: string;

  @IsInt()
  @Min(1)
  @Max(2)
  term: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}
