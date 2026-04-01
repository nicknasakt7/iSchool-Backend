import { Expose } from 'class-transformer';

export class ParentResponseDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  tel?: string;
}
