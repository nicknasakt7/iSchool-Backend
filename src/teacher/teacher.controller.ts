import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateTeacherDto } from './dtos/create-teacher.dto';
import { TeacherService } from './teacher.service';
import { AssignSubjectDto } from './dtos/assign-subject.dto';
import { UpdateTeacherDto } from './dtos/update-teacher.dto';
import { Role } from 'src/database/generated/prisma/enums';

@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teacherService.create(createTeacherDto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  findAll() {
    return this.teacherService.findAll();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teacherService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
    return this.teacherService.update(id, updateTeacherDto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teacherService.remove(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('assign-subject')
  assignSubject(@Body() assignSubjectDto: AssignSubjectDto) {
    return this.teacherService.assignSubject(assignSubjectDto);
  }
}
