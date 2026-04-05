import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AttendanceSummaryResponseDto {
  @Expose()
  @ApiProperty()
  total: number;

  @Expose()
  @ApiProperty()
  present: number;

  @Expose()
  @ApiProperty()
  absent: number;
}
