import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class DeleteConfigResponseDto {
  @Expose()
  deletedConfigId: string;

  @Expose()
  affectedStudentsCount: number;
}
