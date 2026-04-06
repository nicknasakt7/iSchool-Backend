// ใช้สำหรับรับคะแนนทั้งแถวจาก UI
import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
  Min,
  ArrayMinSize,
  IsOptional,
  Max,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScoreItemDto } from './score-item.dto';

// ใช้สำหรับรับคะแนนทั้งแถวจาก UI

export class CreateScoreWithItemsDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  subjectId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(2)
  term: number;

  @Type(() => Number)
  @IsNumber()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  items: ScoreItemDto[];

  @IsOptional()
  @IsString()
  comment?: string;
}

//ไฟล์นี้ มีไว้เพราะUI ของเรา จะสร้างคะแนนทีเดียวทั้งแถวเลย
//คือตอนครูสร้างคะแนน จะสร้างทีเดียวแล้วกดsave
