import { PartialType, PickType } from '@nestjs/swagger';
import { BaseTeacherDto } from '../base/base-teacher.dto';

export class UpdateTeacherDto extends PartialType(
  PickType(BaseTeacherDto, [
    'firstName',
    'lastName',
    'homeroomClassId',
  ] as const),
) {}
