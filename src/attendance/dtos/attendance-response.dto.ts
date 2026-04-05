import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { AttendanceStatus } from 'src/database/generated/prisma/enums';

@Exclude()
export class AttendanceResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  studentId: string;

  @Expose()
  @ApiProperty()
  date: Date;

  @Expose()
  @ApiProperty({ enum: AttendanceStatus })
  status: AttendanceStatus;

  @Expose()
  @ApiProperty()
  createAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
