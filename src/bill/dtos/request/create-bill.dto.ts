import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsPositive,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class CreateBillDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsInt()
  term: number;

  @IsInt()
  year: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  studentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  classroomIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  gradeIds?: string[];
}
