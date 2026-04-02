import { PartialType } from '@nestjs/swagger';
import { BaseStudentDto } from '../base/base-student.dto';

export class UpdateStudentDto extends PartialType(BaseStudentDto) {}
