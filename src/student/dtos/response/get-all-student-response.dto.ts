import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, IsUUID } from 'class-validator';

export class GetAllStudentsQueryResponseDto {
  @IsOptional()
  @IsString()
  search?: string;

  // filter ตาม DB จริง
  @IsOptional()
  @IsUUID()
  gradeId?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  // pagination
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
