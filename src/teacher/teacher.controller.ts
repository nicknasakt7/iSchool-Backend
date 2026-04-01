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
import { UpdateTeacherDto } from './dtos/update-teacher.dto';
import { Role } from 'src/database/generated/prisma/enums';
import { CreateTeacherDto } from './dtos/create-teacher.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { AssignSubjectDto } from './dtos/assign-subject.dto';

@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Public()
  @Post()
  create(@Body() createTeacherDto: CreateTeacherDto) {
    console.log('🔥 CONTROLLER HIT');
    console.log('📦 BODY:', createTeacherDto);

    console.log('👉 BEFORE SERVICE');
    return this.teacherService.create(createTeacherDto);
    console.log('👉 AFTER SERVICE CALL');
  }

  // @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  // @Get()
  // findAll() {
  //   return this.teacherService.findAll();
  // }

  // @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.teacherService.findOne(id);
  // }

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

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/assign-subject')
  assignSubject(
    @Param('id', ParseUUIDPipe) teacherId: string,
    @Body() assignSubjectDto: AssignSubjectDto,
  ) {
    return this.teacherService.assignSubject(teacherId, assignSubjectDto);
  }
}
