import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

export class BaseTeacherDto {
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @Trim()
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Trim()
  lastName: string;

  @IsOptional()
  @IsUUID('4', { message: 'homeroomClassId must be a valid UUID' })
  homeroomClassId?: string;
}
