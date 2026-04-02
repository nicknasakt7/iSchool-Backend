import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ScoreItemResponseDto {
  @Expose()
  configId: string;

  @Expose()
  value: number;
}
