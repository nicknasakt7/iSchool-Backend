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
import { CreateStudentDto } from './dtos/create-student.dto';
import { StudentService } from './student.service';
import { UpdateStudentDto } from './dtos/update-student.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { Role } from 'src/database/generated/prisma/enums';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // ✅ ADMIN เท่านั้นสร้างได้
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  async create(@Body() createAdminDto: CreateStudentDto): Promise<string> {
    await this.studentService.create(createAdminDto);
    return 'Student created successfully';
  }

  // ✅ ครู / แอดมินดูได้
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @Get()
  findAll() {
    return this.studentService.findAll();
  }

  // ✅ ครู / แอดมินดูได้
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PARENT, Role.TEACHER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  // ✅ ADMIN แก้ไข
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(id, updateStudentDto);
  }

  // ✅ SUPER ADMIN ลบ
  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @Get('/grade/:gradeId')
  findByGrade(@Param('gradeId') gradeId: string) {
    return this.studentService.findByGrade(gradeId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @Get('/classroom/:classroomId')
  findByClassroom(@Param('classroomId') classroomId: string) {
    return this.studentService.findByClassroom(classroomId);
  }

  @Public()
  @Get('/search')
  searchStudents(@Query('query') query: string) {
    return this.studentService.searchStudent(query);
  }
}
