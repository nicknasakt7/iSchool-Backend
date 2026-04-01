import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { TeacherService } from './teacher.service';
import { UpdateTeacherDto } from './dtos/update-teacher.dto';
import { Role } from 'src/database/generated/prisma/enums';
import { CreateTeacherDto } from './dtos/create-teacher.dto';
import { AssignSubjectDto } from './dtos/assign-subject.dto';
import { TeacherResponseDto } from './dtos/teacher-response.dto';
import { SubjectAssignmentResponseDto } from './dtos/subject-assignment-response.dto';

@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: TeacherResponseDto,
    excludeExtraneousValues: true,
  })
  @Post()
  create(
    @Body() createTeacherDto: CreateTeacherDto,
  ): Promise<TeacherResponseDto> {
    return this.teacherService.create(createTeacherDto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: TeacherResponseDto,
    excludeExtraneousValues: true,
  })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ): Promise<TeacherResponseDto> {
    return this.teacherService.update(id, updateTeacherDto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.teacherService.deleteTeacher(id);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: SubjectAssignmentResponseDto,
    excludeExtraneousValues: true,
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/assign-subject')
  assignSubject(
    @Param('id', ParseUUIDPipe) teacherId: string,
    @Body() assignSubjectDto: AssignSubjectDto,
  ): Promise<SubjectAssignmentResponseDto> {
    return this.teacherService.assignSubject(teacherId, assignSubjectDto);
  }
}
