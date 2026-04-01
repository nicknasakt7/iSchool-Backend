import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class BaseGradeDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsInt()
  level: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
