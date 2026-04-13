import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateClassroomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
