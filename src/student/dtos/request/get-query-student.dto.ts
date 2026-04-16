import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Gender } from 'src/database/generated/prisma/enums';

export class GetStudentsQueryDto {
  @IsOptional()
  @IsString()
  search?: string | null;

  // filter จริงที่ควรใช้ (ใช้ id = best practice)
  @IsOptional()
  @IsUUID()
  gradeId?: string | null;

  @IsOptional()
  @IsUUID()
  classId?: string | null;

  // optional เพิ่มความเทพ
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender | null;

  // pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
