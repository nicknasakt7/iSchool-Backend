import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollmentStatus } from 'src/database/generated/prisma/enums';

export class StudentPromotionItemDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  // PROMOTED = ขึ้นชั้น, REPEATED = ซ้ำชั้น, TRANSFERRED = ย้ายโรงเรียน
  @IsEnum(EnrollmentStatus)
  outcome: EnrollmentStatus;

  // กรณี PROMOTED หรือ REPEATED → ระบุ gradeId ปลายทาง
  @IsOptional()
  @IsUUID()
  targetGradeId?: string;

  // กรณี PROMOTED หรือ REPEATED → ระบุ classroomId ปลายทาง (optional)
  @IsOptional()
  @IsUUID()
  targetClassroomId?: string;
}

export class BulkPromoteDto {
  // ปี/เทอมของ enrollment ปัจจุบัน (source)
  @IsInt()
  @Min(2000)
  @Max(2100)
  sourceYear: number;

  @IsInt()
  @Min(1)
  @Max(2)
  sourceTerm: number;

  // ปี/เทอมของ enrollment ใหม่ (target)
  @IsInt()
  @Min(2000)
  @Max(2100)
  targetYear: number;

  @IsInt()
  @Min(1)
  @Max(2)
  targetTerm: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentPromotionItemDto)
  students: StudentPromotionItemDto[];
}
