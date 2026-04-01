import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TeacherProfileDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  firstName: string;

  @Expose()
  @ApiProperty()
  lastName: string;

  @Expose()
  @ApiProperty({ required: false })
  homeroomClassId?: string;

  @Expose()
  @ApiProperty({ required: false })
  tel?: string;

  @Expose()
  @ApiProperty({ required: false })
  analysesCount?: number; // จำนวน AIStudentAnalysis ทั้งหมดของครู

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
