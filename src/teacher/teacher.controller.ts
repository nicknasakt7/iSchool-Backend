import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { TeacherService } from './teacher.service';

import { Role } from 'src/database/generated/prisma/enums';
import { CreateTeacherDto } from './dtos/request/create-teacher.dto';
import { UpdateTeacherDto } from './dtos/request/update-teacher.dto';
import { SubjectAssignmentResponseDto } from './dtos/response/subject-assignment-response.dto';
import { AssignSubjectDto } from './dtos/request/assign-subject.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeacherResponseDto } from './dtos/response/teacher-response.dto';
import { GetAllTeachersQueryResponseDto } from './dtos/response/get-all-query-response.dto';
import { GetTeachersQueryDto } from 'src/student/dtos/response/get-teacher-query.dto';

@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  @UseInterceptors(
    FileInterceptor('profileImage', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  createTeacher(
    @Body() createTeacherDto: CreateTeacherDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<TeacherResponseDto> {
    return this.teacherService.create(createTeacherDto, file);
  }

  @Patch(':id/profile-image')
  @UseInterceptors(
    FileInterceptor('profileImage', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadTeacherProfileImage(
    @Param('id') teacherId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.teacherService.uploadProfileImage(teacherId, file);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('summary')
  getTeacherSummary() {
    return this.teacherService.getTeacherSummary();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: GetAllTeachersQueryResponseDto,
    excludeExtraneousValues: true,
  })
  @Get()
  findAll(
    @Query() query: GetTeachersQueryDto,
  ): Promise<GetAllTeachersQueryResponseDto> {
    return this.teacherService.findAll(query);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: TeacherResponseDto,
    excludeExtraneousValues: true,
  })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<TeacherResponseDto> {
    return this.teacherService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    return this.teacherService.update(id, updateTeacherDto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.teacherService.deleteTeacher(id);
  }

  @Roles(Role.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: SubjectAssignmentResponseDto,
    excludeExtraneousValues: true,
  })
  @Post('assign-subject')
  assignSubject(
    @Body() assignSubjectDto: AssignSubjectDto,
  ): Promise<SubjectAssignmentResponseDto> {
    return this.teacherService.assignSubject(assignSubjectDto);
  }
}
