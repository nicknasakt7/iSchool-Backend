import { Expose } from 'class-transformer';

export class ClassroomResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  gradeId: string;

  @Expose()
  isActive: boolean;
}
