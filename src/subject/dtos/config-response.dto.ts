import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ConfigResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  score: number;

  @Expose()
  order: number;
}
