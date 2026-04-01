import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

//ไฟล์นี้ มีไว้เพราะUI ของเรา จะสร้างคะแนนทีเดียวทั้งแถวเลย
//คือตอนครูสร้างคะแนน จะสร้างทีเดียวแล้วกดsave

class ScoreItemInput {
  @IsString()
  @IsNotEmpty()
  configId: string;

  @IsNumber()
  @Min(0)
  value: number;
}

export class CreateScoreWithItemsDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsNumber()
  term: number;

  @IsNumber()
  year: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreItemInput)
  items: ScoreItemInput[];
}
