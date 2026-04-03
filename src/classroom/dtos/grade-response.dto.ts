import { Expose, Type } from 'class-transformer';
import { ClassroomResponseDto } from './classroom-response.dto';

export class GradeResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  level: number;

  @Expose()
  isActive: boolean;

  @Expose()
  @Type(() => ClassroomResponseDto)
  classrooms?: ClassroomResponseDto[] | null;
}
