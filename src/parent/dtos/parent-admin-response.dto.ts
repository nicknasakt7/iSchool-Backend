import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class StudentInParentDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
}

@Exclude()
export class ParentAdminResponseDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() email: string;
  @Expose() tel?: string | null;
  @Expose() lineId?: string | null;

  @Expose()
  @Type(() => StudentInParentDto)
  students?: StudentInParentDto[];
}
