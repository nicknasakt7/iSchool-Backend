import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ScoreItemDto } from './score-item.dto';

export class SubmitScoreWithCommentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  subjectId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  scores: ScoreItemDto[];

  @IsString()
  comment: string;
}
