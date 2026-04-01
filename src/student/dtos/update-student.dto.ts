import { PartialType } from '@nestjs/swagger';
import { BaseStudentDto } from './base-student.dto';

export class UpdateStudentDto extends PartialType(BaseStudentDto) {}
