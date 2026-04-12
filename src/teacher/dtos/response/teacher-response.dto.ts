import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Gender } from 'src/database/generated/prisma/enums';
import { SubjectAssignmentResponseDto } from './subject-assignment-response.dto';

@Exclude()
export class HomeroomClassInTeacherDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() gradeId: string;
  @Expose() gradeLevel: number;
  @Expose() gradeName: string;
}

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
  @Type(() => HomeroomClassInTeacherDto)
  @ApiProperty({ nullable: true })
  homeroomClass?: HomeroomClassInTeacherDto | null;

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
