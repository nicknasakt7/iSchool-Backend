import { Expose, Type } from 'class-transformer';
import { StudentResponseDto } from './student-response.dto';

export class GetAllStudentsQueryResponseDto {
  // pagination
  @Type(() => StudentResponseDto)
  @Expose()
  data: StudentResponseDto[];

  @Expose()
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
