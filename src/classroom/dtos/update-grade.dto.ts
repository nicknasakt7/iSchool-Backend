import { PartialType } from '@nestjs/swagger';
import { BaseGradeDto } from './base-grade.dto';

export class UpdateGradeDto extends PartialType(BaseGradeDto) {}
