import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { EnrollmentService } from './enrollment.service';
import { BulkPromoteDto } from './dtos/bulk-promote.dto';
import { EnrollmentHistoryQueryDto } from './dtos/enrollment-history-query.dto';
import { EnrollmentResponseDto } from './dtos/enrollment-response.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  // POST /enrollments/promote
  // ขึ้นชั้น / ซ้ำชั้น / ย้ายโรงเรียน (bulk)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('promote')
  promote(@Body() bulkPromoteDto: BulkPromoteDto) {
    return this.enrollmentService.promote(bulkPromoteDto);
  }

  // GET /enrollments/history?studentId=&gradeId=&year=&term=
  // ดูประวัติ enrollment
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @SerializeOptions({ type: EnrollmentResponseDto, excludeExtraneousValues: true })
  @Get('history')
  getHistory(@Query() queryDto: EnrollmentHistoryQueryDto) {
    return this.enrollmentService.getHistory(queryDto);
  }

  // GET /enrollments/students?gradeId=&classroomId=&year=&term=
  // ดึงนักเรียนสำหรับหน้า promotion
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('students')
  getStudentsForPromotion(
    @Query('gradeId') gradeId?: string,
    @Query('classroomId') classroomId?: string,
    @Query('year') year?: string,
    @Query('term') term?: string,
  ) {
    return this.enrollmentService.getStudentsForPromotion(
      gradeId,
      classroomId,
      year ? parseInt(year, 10) : undefined,
      term ? parseInt(term, 10) : undefined,
    );
  }
}
