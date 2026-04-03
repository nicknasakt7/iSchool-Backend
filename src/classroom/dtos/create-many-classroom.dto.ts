import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ClassroomItemDto {
  @IsString()
  @IsNotEmpty()
  gradeName: string;

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
