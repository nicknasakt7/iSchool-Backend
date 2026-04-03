import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateClassroomDto {
  @IsOptional()
  @IsString()
  name?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean | null;
}
