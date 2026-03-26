import { IsOptional, IsString } from 'class-validator';

export class UpdateSubjectDto {
  @IsString()
  @IsOptional()
  name?: string;
}
