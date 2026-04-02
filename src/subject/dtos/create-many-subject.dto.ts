import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSubjectDto } from './create-subject.dto';

export class CreateManySubjectDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectDto)
  subjects: CreateSubjectDto[];
}
