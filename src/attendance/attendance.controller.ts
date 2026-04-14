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
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dtos/create-attendance';
import { AttendanceResponseDto } from './dtos/attendance-response.dto';

@Controller('attendance')
@UseInterceptors(ClassSerializerInterceptor)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @SerializeOptions({ excludeExtraneousValues: true })
  @Post()
  takeAttendance(
    @Body()
    createAttendanceDto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto[]> {
    return this.attendanceService.takeAttendance(createAttendanceDto);
  }

  @Get('school-summary')
  getSchoolSummary(@Query('date') date?: string) {
    return this.attendanceService.getSchoolAttendanceSummary(date);
  }

  @SerializeOptions({ excludeExtraneousValues: true })
  @Get('summary')
  getSummary(
    @Query('classId') classId: string,
    @Query('date') date?: string,
  ) {
    return this.attendanceService.getTodayAttendanceByClass(classId, date);
  }
}
