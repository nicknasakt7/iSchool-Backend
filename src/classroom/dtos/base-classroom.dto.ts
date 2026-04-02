import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Expose } from 'class-transformer';

export class BaseClassroomDto {
  @IsString()
  @Expose()
  name: string;

  @IsString()
  @Expose()
  gradeId: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean = true;
}
