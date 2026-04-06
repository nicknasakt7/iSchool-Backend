import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ClassroomResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  gradeId: string;

  @Expose()
  year: number | null;

  @Expose()
  term: number | null;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;
}
