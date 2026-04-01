import { Exclude, Expose, Type } from 'class-transformer';
import { SubjectResponseDto } from './subject-response.dto';

@Exclude()
export class SubjectWithConfigResponseDto extends SubjectResponseDto {
  @Expose()
  @Type(() => SubjectWithConfigResponseDto)
  configs: SubjectWithConfigResponseDto[];
}
