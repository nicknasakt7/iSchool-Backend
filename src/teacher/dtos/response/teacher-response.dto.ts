import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Gender } from 'src/database/generated/prisma/enums';
import { SubjectAssignmentResponseDto } from './subject-assignment-response.dto';

@Exclude()
export class TeacherResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  firstName: string;

  @Expose()
  @ApiProperty()
  lastName: string;

  @Expose()
  @ApiProperty({ enum: Gender })
  gender: Gender;

  @Expose()
  @ApiProperty({ nullable: true })
  homeroomClassId?: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  profileImageUrl?: string | null;

  @Expose()
  @Type(() => SubjectAssignmentResponseDto)
  @ApiProperty({ type: () => [SubjectAssignmentResponseDto], required: false })
  subjects?: SubjectAssignmentResponseDto[] | null;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
