import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { CreateGradeDto } from './dtos/create-grade.dto';
import { ClassroomService } from './classroom.service';
import { UpdateGradeDto } from './dtos/update-grade.dto';
import { CreateClassroomDto } from './dtos/create-classroom.dto';
import { UpdateClassroomDto } from './dtos/update-classroom.dto';

@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  // Grade
  @Post('grades')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  createGrade(@Body() createGradeDto: CreateGradeDto) {
    return this.classroomService.createGrade(createGradeDto);
  }

  @Get('grades')
  getGrades() {
    return this.classroomService.getGrades();
  }

  @Patch('grades/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  updateGrade(@Param('id') id: string, @Body() updateGradeDto: UpdateGradeDto) {
    return this.classroomService.updateGrade(id, updateGradeDto);
  }

  @Delete('grades/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  deleteGrade(@Param('id') id: string) {
    return this.classroomService.deleteGrade(id);
  }

  // Classroom
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  createClassroom(@Body() createClassroomDto: CreateClassroomDto) {
    return this.classroomService.createClassroom(createClassroomDto);
  }

  @Get()
  getClassrooms(@Query('gradeId') gradeId?: string) {
    return this.classroomService.getClassrooms(gradeId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  updateClassroom(
    @Param('id') id: string,
    @Body() updateClassroom: UpdateClassroomDto,
  ) {
    return this.classroomService.updateClassroom(id, updateClassroom);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  deleteClassroom(@Param('id') id: string) {
    return this.classroomService.deleteClassroom(id);
  }
}
