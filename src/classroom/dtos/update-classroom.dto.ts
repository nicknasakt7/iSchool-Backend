import { PartialType } from '@nestjs/swagger';
import { BaseClassroomDto } from './base-classroom.dto';

export class UpdateClassroomDto extends PartialType(BaseClassroomDto) {}
