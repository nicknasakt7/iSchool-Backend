import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Expose } from 'class-transformer';

export class BaseClassroomDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  gradeName: string;

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
