import { IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';
import { Expose } from 'class-transformer';

export class BaseGradeDto {
  @IsString()
  @Expose()
  name: string;

  @IsInt()
  @Expose()
  level: number;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean = true;
}
