import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConfigItemDto {
  // Present = update existing config; absent = create new config
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  maxScore: number;

  @IsInt()
  order: number;
}

export class UpsertConfigDto {
  @IsUUID()
  subjectAssignmentId: string;

  @IsInt()
  @Min(1)
  @Max(2)
  term: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConfigItemDto)
  items: ConfigItemDto[];
}
