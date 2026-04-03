import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class BaseSubjectDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;
}
