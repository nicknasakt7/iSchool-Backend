import { IsString, IsNotEmpty } from 'class-validator';
import { Trim } from 'src/common/decorators/trim.decorator';

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  name: string;
}
