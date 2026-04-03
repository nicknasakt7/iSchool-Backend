import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubjectItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateManySubjectDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SubjectItemDto)
  subjects: SubjectItemDto[];
}
