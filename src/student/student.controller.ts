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
import { CreateStudentDto } from './dtos/create-student.dto';
import { StudentService } from './student.service';
import { UpdateStudentDto } from './dtos/update-student.dto';

@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // ✅ ADMIN เท่านั้นสร้างได้
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Post()
  async create(@Body() createAdminDto: CreateStudentDto): Promise<string> {
    await this.studentService.create(createAdminDto);
    return 'Student created successfully';
  }

  // ✅ ครู / แอดมินดูได้
  @Roles('ADMIN', 'TEACHER', 'SUPER_ADMIN')
  @Get()
  findAll() {
    return this.studentService.findAll();
  }

  // ✅ ครู / แอดมินดูได้
  @Roles('ADMIN', 'TEACHER', 'SUPER_ADMIN', 'PARENT')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  // ✅ ADMIN แก้ไข
  @Roles('ADMIN', 'SUPER_ADMIN')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(id, updateStudentDto);
  }

  // ✅ SUPER ADMIN ลบ
  @Roles('SUPER_ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }
}
