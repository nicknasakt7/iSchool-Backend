import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { TeacherService } from './teacher.service';

import { Role } from 'src/database/generated/prisma/enums';

import { Public } from 'src/auth/decorators/public.decorator';
import { CreateTeacherDto } from './dtos/request/create-teacher.dto';
import { UpdateTeacherDto } from './dtos/request/update-teacher.dto';

@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Public()
  @Post()
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.create(createTeacherDto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    return this.teacherService.update(id, updateTeacherDto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.teacherService.deleteTeacher(id);
  }

  // @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  // @Post('assign-subject')
  // assignSubject(@Body() assignSubjectDto: AssignSubjectDto) {
  //   return this.teacherService.assignSubject(assignSubjectDto);
  // }
}
