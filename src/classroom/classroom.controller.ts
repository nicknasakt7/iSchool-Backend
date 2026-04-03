import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { CreateGradeDto } from './dtos/create-grade.dto';
import { UpdateGradeDto } from './dtos/update-grade.dto';
import { CreateClassroomDto } from './dtos/create-classroom.dto';
import { UpdateClassroomDto } from './dtos/update-classroom.dto';
import { CreateManyClassroomDto } from './dtos/create-many-classroom.dto';
import { ClassroomService } from './classroom.service';
import { GradeResponseDto } from './dtos/grade-response.dto';
import { ClassroomResponseDto } from './dtos/classroom-response.dto';

@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  // ======= Grade =======
  @Post('grades')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: GradeResponseDto, excludeExtraneousValues: true })
  async createGrade(
    @Body() createGradeDto: CreateGradeDto,
  ): Promise<GradeResponseDto> {
    return this.classroomService.createGrade(createGradeDto);
  }

  @Get('grades')
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: GradeResponseDto, excludeExtraneousValues: true })
  async getGrades(): Promise<GradeResponseDto[]> {
    return this.classroomService.getGrades();
  }

  @Patch('grades/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: GradeResponseDto, excludeExtraneousValues: true })
  async updateGrade(
    @Param('id') id: string,
    @Body() updateGradeDto: UpdateGradeDto,
  ): Promise<GradeResponseDto> {
    return this.classroomService.updateGrade(id, updateGradeDto);
  }

  @Delete('grades/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async deleteGrade(@Param('id') id: string) {
    return this.classroomService.deleteGrade(id);
  }

  // ======= Classroom =======
  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: ClassroomResponseDto,
    excludeExtraneousValues: true,
  })
  async createClassroom(
    @Body() createClassroomDto: CreateClassroomDto,
  ): Promise<ClassroomResponseDto> {
    return this.classroomService.createClassroom(createClassroomDto);
  }

  @Post('many')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async createManyClassrooms(
    @Body() createManyClassroomDto: CreateManyClassroomDto,
  ) {
    return this.classroomService.createManyClassrooms(createManyClassroomDto);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: ClassroomResponseDto,
    excludeExtraneousValues: true,
  })
  async getClassrooms(
    @Query('gradeId') gradeId?: string,
  ): Promise<ClassroomResponseDto[]> {
    return this.classroomService.getClassrooms(gradeId);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: ClassroomResponseDto,
    excludeExtraneousValues: true,
  })
  async updateClassroom(
    @Param('id') id: string,
    @Body() updateClassroomDto: UpdateClassroomDto,
  ): Promise<ClassroomResponseDto> {
    return this.classroomService.updateClassroom(id, updateClassroomDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async deleteClassroom(@Param('id') id: string) {
    return this.classroomService.deleteClassroom(id);
  }
}
