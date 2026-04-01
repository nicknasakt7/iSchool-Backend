import { IsEmail } from 'class-validator';

export class CreateParentInviteDto {
  @IsEmail()
  email: string;
}
