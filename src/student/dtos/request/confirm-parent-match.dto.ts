import { IsNotEmpty, IsUUID } from 'class-validator';

export class ConfirmParentMatchDto {
  @IsUUID()
  @IsNotEmpty()
  parentId: string;
}
