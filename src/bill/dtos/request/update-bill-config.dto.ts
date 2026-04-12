import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class UpdateBillConfigDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9]{1,10}$/, {
    message: 'Prefix must be 1-10 uppercase letters or digits (e.g. SCH)',
  })
  prefix: string;
}
