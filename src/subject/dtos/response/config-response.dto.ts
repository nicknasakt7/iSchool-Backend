import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ConfigResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  maxScore: number;

  @Expose()
  order: number;

  @Expose()
  year: number;

  @Expose()
  term: number;
}
