import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateStudentDto } from './dtos/create-student.dto';
import { StudentService } from './student.service';
import { UpdateStudentDto } from './dtos/update-student.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { AssignParentDto } from './dtos/assign-parent.dto';
import { StudentResponseDto } from './dtos/student-response.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // Create Student (ADMIN, SUPER_ADMIN)
  // POST /students
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  // Get all students (ADMIN, SUPER_ADMIN, TEACHER)
  // GET /students
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Get()
  findAll() {
    return this.studentService.findAll();
  }

  // Search students (Public)
  // GET /students/search/by-query?query=xxx
  @Public()
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Get('search/by-query')
  searchStudents(@Query('query') query: string) {
    return this.studentService.searchStudent(query);
  }

  // Get students by grade
  // GET /students/grade/:gradeId
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Get('grade/:gradeId')
  findByGrade(@Param('gradeId') gradeId: string) {
    return this.studentService.findByGrade(gradeId);
  }

  // Get students by classroom
  // GET /students/classroom/:classroomId
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Get('classroom/:classroomId')
  findByClassroom(@Param('classroomId') classroomId: string) {
    return this.studentService.findByClassroom(classroomId);
  }

  // Assign parent to student (ADMIN, SUPER_ADMIN)
  // PATCH /students/:id/parent
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Patch(':id/parent')
  assignParent(
    @Param('id') studentId: string,
    @Body() assignParentDto: AssignParentDto,
  ) {
    return this.studentService.assignParent(
      studentId,
      assignParentDto.parentId,
    );
  }

  // Remove parent from student (ADMIN, SUPER_ADMIN)
  // DELETE /students/:id/parent
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Delete(':id/parent')
  removeParent(@Param('id') studentId: string) {
    return this.studentService.removeParent(studentId);
  }

  // Get student by ID (ADMIN, SUPER_ADMIN, TEACHER, PARENTS)
  // GET /students/:id
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER, Role.PARENTS)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  // Update student (ADMIN, SUPER_ADMIN)
  // PATCH /students/:id
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(id, updateStudentDto);
  }

  // Soft Delete student (SUPER_ADMIN)
  // DELETE /students/:id
  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }
}
