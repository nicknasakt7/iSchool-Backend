import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCalendarDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}
