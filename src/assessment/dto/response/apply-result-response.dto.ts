import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ApplyResultResponseDto {
  @Expose()
  studentsCount: number;

  @Expose()
  configsCount: number;

  @Expose()
  applied: number;
}
