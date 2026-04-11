import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateClassroomDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
