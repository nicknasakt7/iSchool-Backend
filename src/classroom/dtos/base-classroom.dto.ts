import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

export class BaseClassroomDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  gradeName: string;

  @IsOptional()
  @IsBoolean()
  @Expose()
  isActive?: boolean = true;
}
