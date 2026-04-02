import { IsUUID } from 'class-validator';

export class AssignParentDto {
  @IsUUID()
  parentId: string;
}
