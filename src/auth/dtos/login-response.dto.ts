import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class LoginResponseDto {
  @ApiProperty()
  @Expose()
  accessToken: string;

  @Expose()
  @ApiProperty()
  expiresIn: number;

  //   @Expose()
  //   @ApiProperty()
  //   user: EmployeeResponseDto;
}
