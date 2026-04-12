import { IsArray, IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AttendanceItemDto {
  @IsString()
  studentId: string;

  @IsEnum(['PRESENT', 'ABSENT'])
  status: 'PRESENT' | 'ABSENT';
}

export class CreateAttendanceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceItemDto)
  records: AttendanceItemDto[];

  @IsOptional()
  @IsDateString()
  date?: string; // YYYY-MM-DD — ถ้าไม่ส่งใช้วันนี้
}
