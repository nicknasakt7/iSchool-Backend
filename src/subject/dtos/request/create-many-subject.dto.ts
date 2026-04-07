import {
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubjectItemDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Subject name must be at least 2 characters' })
  @Matches(/^[\u0E00-\u0E7Fa-zA-Z][\u0E00-\u0E7Fa-zA-Z0-9\s\-().]*$/, {
    message:
      'Subject name must start with a letter and contain only letters, numbers, spaces, hyphens, parentheses, or dots',
  })
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
