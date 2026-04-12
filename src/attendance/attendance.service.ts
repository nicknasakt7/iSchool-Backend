import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateAttendanceDto } from './dtos/create-attendance';
import { AttendanceStatus } from 'src/database/generated/prisma/enums';
import { AttendanceResponseDto } from './dtos/attendance-response.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async takeAttendance(
    createAttendanceDto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto[]> {
    const today = createAttendanceDto.date
      ? new Date(createAttendanceDto.date)
      : new Date();
    today.setHours(0, 0, 0, 0);

    //  map จาก dto -> prisma data
    const operations = createAttendanceDto.records.map((record) => {
      const status =
        record.status === 'PRESENT'
          ? AttendanceStatus.PRESENT
          : AttendanceStatus.ABSENT;

      return this.prisma.attendance.upsert({
        where: {
          studentId_date: {
            studentId: record.studentId,
            date: today,
          },
        },
        update: {
          status,
        },
        create: {
          studentId: record.studentId,
          date: today,
          status,
        },
      });
    });

    //  ยิงทั้งหมด
    const result = await this.prisma.$transaction(operations);

    return result;
  }

  // ==== ส่วนของการ์ดจำนวนนรที่มาเรียน
  async getTodayAttendanceByClass(classId: string, date?: string) {
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);

    // 🧑นักเรียนทั้งหมดในห้องนี้
    const students = await this.prisma.student.findMany({
      where: {
        classId,
      },
      select: {
        id: true,
      },
    });

    const studentIds = students.map((s) => s.id);

    // attendance ของวันนี้ (เฉพาะเด็กกลุ่มนี้)
    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: today,
        studentId: {
          in: studentIds,
        },
      },
      select: {
        status: true,
      },
    });

    const total = students.length;

    const present = attendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length;

    const absent = total - present;

    return {
      total,
      present,
      absent,
    };
  }
}
