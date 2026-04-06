import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ClassroomItemDto {
  @IsString()
  @IsNotEmpty()
  gradeName: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2)
  term?: number | null;
}

export class CreateManyClassroomDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassroomItemDto)
  classrooms: ClassroomItemDto[];
}
