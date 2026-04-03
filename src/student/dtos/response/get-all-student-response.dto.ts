import { Expose, Type } from 'class-transformer';
import { StudentResponseDto } from './student-response.dto';

export class GetAllStudentsQueryResponseDto {
  // @IsOptional()
  // @IsString()
  // search?: string;

  // // filter ตาม DB จริง
  // @IsOptional()
  // @IsUUID()
  // gradeId?: string;

  // @IsOptional()
  // @IsUUID()
  // classId?: string;

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
