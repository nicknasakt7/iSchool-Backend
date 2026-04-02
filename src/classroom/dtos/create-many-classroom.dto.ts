import {
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ClassroomItemDto {
  @IsUUID('4', { message: 'gradeId must be a valid UUID' })
  @IsNotEmpty()
  gradeId: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateManyClassroomDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassroomItemDto)
  classrooms: ClassroomItemDto[];
}
