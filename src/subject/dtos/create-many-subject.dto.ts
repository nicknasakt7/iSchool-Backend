<<<<<<< HEAD
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSubjectDto } from './create-subject.dto';

export class CreateManySubjectDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectDto)
  subjects: CreateSubjectDto[];
=======
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
>>>>>>> f49fe39 (feat(subject2): Add create-many-subject.dto.ts , create many subject)
}
