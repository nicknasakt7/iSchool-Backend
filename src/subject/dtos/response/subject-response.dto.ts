import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SubjectResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
