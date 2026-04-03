import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ParentResponseDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  tel?: string | null;
}
