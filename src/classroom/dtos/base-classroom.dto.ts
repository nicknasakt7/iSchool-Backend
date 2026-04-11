import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsInt,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Expose } from 'class-transformer';

export class BaseClassroomDto {
  // ชื่อห้องเรียน free-form เช่น "1/1", "EP-1", "Grade 1A"
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  // รับ gradeId โดยตรง ไม่ต้อง lookup จากชื่อ
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  gradeId: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean = true;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Expose()
  year?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  @Expose()
  term?: number | null;
}
