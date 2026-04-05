import { IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateOrUpdateCommentDto {
  @IsUUID()
  studentId: string;

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

  @IsString()
  @IsNotEmpty()
  content: string;
}
