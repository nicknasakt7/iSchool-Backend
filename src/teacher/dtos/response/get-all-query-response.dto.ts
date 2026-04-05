import { Expose, Type } from 'class-transformer';
import { TeacherResponseDto } from './teacher-response.dto';

export class GetAllTeachersQueryResponseDto {
  @Expose()
  @Type(() => TeacherResponseDto)
  data: TeacherResponseDto[];

  @Expose()
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
