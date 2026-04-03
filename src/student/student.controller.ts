import {
  BadRequestException,
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateStudentDto } from './dtos/request/create-student.dto';
import { StudentService } from './student.service';
import { UpdateStudentDto } from './dtos/request/update-student.dto';
import { Role } from 'src/database/generated/prisma/enums';
import { AssignParentDto } from './dtos/request/assign-parent.dto';
import { StudentResponseDto } from './dtos/response/student-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetStudentsQueryDto } from './dtos/request/get-query-student.dto';
import { GetAllStudentsQueryResponseDto } from './dtos/response/get-all-student-response.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  // ========================
  // CREATE STUDENT
  // ========================
  // POST /students
  // - สร้าง student ใหม่
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Post()
  async create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentService.create(createStudentDto);
  }

  // ========================
  // GET ALL STUDENTS
  // ========================
  // GET /students
  // - ดึง student ทั้งหมด (ไม่รวมที่ soft delete)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @SerializeOptions({
    type: GetAllStudentsQueryResponseDto,
    excludeExtraneousValues: true,
  })
  @Get()
  findAll(
    @Query() query: GetStudentsQueryDto,
  ): Promise<GetAllStudentsQueryResponseDto> {
    return this.studentService.findAll(query);
  }

  // ========================
  // SEARCH STUDENT
  // ========================
  // GET /students/search/by-query?query=xxx
  // - search จาก name / studentCode / parentsEmail
  // @Public()
  // @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  // @Get('search/by-query')
  // searchStudents(@Query('query') query: string) {
  //   return this.studentService.searchStudent(query);
  // }

  // ========================
  // FILTER BY GRADE
  // ========================
  // GET /students/grade/:gradeId
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Get('grade/:grade-id')
  findByGrade(@Param('grade-id') gradeId: string) {
    return this.studentService.findByGrade(gradeId);
  }

  // ========================
  // FILTER BY CLASSROOM
  // ========================
  // GET /students/classroom/:classroomId
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Get('classroom/:classroomId')
  findByClassroom(@Param('classroomId') classroomId: string) {
    return this.studentService.findByClassroom(classroomId);
  }

  // ========================
  // FIND PARENT MATCH
  // ========================
  // GET /students/:id/parent-match
  // - ใช้ parentsEmail ไปหา parent ที่ email ตรงกัน
  // - ใช้ในปุ่ม "Find Parents"
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get(':id/parent-match')
  findParentMatch(@Param('id') studentId: string) {
    return this.studentService.findParentMatch(studentId);
  }

  // ========================
  // CONFIRM MATCH
  // ========================
  // PATCH /students/:id/parent-match
  // - ใช้ตอนกด "Match this relation"
  // - ตรวจสอบ email ก่อนผูก parentId
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/parent-match')
  confirmParentMatch(
    @Param('id') studentId: string,
    @Body('parentId') parentId: string,
  ) {
    return this.studentService.confirmParentMatch(studentId, parentId);
  }

  // ========================
  // MANUAL ASSIGN (OVERRIDE)
  // ========================
  // PATCH /students/:id/parent
  // - ใช้เมื่อ auto match ไม่เจอ
  // - admin เลือก parent เอง
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

  // ========================
  // REMOVE PARENT
  // ========================
  // DELETE /students/:id/parent
  // - ลบความสัมพันธ์ parent ออกจาก student
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Delete(':id/parent')
  removeParent(@Param('id') studentId: string) {
    return this.studentService.removeParent(studentId);
  }

  // ========================
  // GET STUDENT BY ID
  // ========================
  // GET /students/:id
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER, Role.PARENTS)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentService.findOne(id);
  }

  // ========================
  // UPDATE STUDENT
  // ========================
  // PATCH /students/:id
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentService.update(id, updateStudentDto);
  }

  // ========================
  // SOFT DELETE STUDENT
  // ========================
  // DELETE /students/:id
  // - set deletedAt แทนการลบจริง
  @Roles(Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentService.remove(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({ type: StudentResponseDto, excludeExtraneousValues: true })
  @Patch(':id/profile-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfileImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.studentService.uploadProfileImage(id, file);
  }
}
