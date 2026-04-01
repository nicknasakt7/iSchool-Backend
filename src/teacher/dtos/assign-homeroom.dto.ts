import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignHomeroomDto {
  @IsUUID('4', { message: 'homeroomClassId must be a valid UUID' })
  @IsNotEmpty()
  homeroomClassId: string;
}
