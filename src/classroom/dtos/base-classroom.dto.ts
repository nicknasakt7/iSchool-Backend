import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class BaseClassroomDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  name: string;

  @IsUUID()
  gradeId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
