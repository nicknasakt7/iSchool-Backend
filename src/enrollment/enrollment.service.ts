import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { EnrollmentStatus } from 'src/database/generated/prisma/enums';
import { BulkPromoteDto } from './dtos/bulk-promote.dto';
import { EnrollmentHistoryQueryDto } from './dtos/enrollment-history-query.dto';

@Injectable()
export class EnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================================
  // BULK PROMOTE
  // ================================================
  // ขึ้นชั้น / ซ้ำชั้น / ย้ายโรงเรียน
  //
  // Flow ต่อ student:
  // 1. ดึง enrollment ปัจจุบัน (sourceYear/sourceTerm) → ถ้าไม่มีก็ข้ามไป
  // 2. Mark enrollment เก่าว่า endDate = now, status = outcome
  // 3. Create enrollment ใหม่ (targetYear/targetTerm) status = ACTIVE
  //    หรือ TRANSFERRED ถ้า outcome = TRANSFERRED
  // 4. อัปเดต student.gradeId / student.classId
  // ================================================
  async promote(bulkPromoteDto: BulkPromoteDto) {
    const { sourceYear, sourceTerm, targetYear, targetTerm, students } =
      bulkPromoteDto;

    if (
      sourceYear === targetYear &&
      sourceTerm === targetTerm
    ) {
      throw new BadRequestException(
        'Source and target year/term must be different',
      );
    }

    const results: object[] = [];
    const skippedStudentIds: string[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const item of students) {
        const student = await tx.student.findFirst({
          where: { id: item.studentId, deletedAt: null },
        });
        if (!student) {
          skippedStudentIds.push(item.studentId);
          continue;
        }

        // ตรวจ target enrollment ซ้ำ
        const existingTarget = await tx.studentEnrollmentHistory.findUnique({
          where: {
            studentId_year_term: {
              studentId: item.studentId,
              year: targetYear,
              term: targetTerm,
            },
          },
        });
        if (existingTarget) {
          skippedStudentIds.push(item.studentId);
          continue;
        }

        // ปิด enrollment เก่า (ถ้ามี)
        const currentEnrollment =
          await tx.studentEnrollmentHistory.findUnique({
            where: {
              studentId_year_term: {
                studentId: item.studentId,
                year: sourceYear,
                term: sourceTerm,
              },
            },
          });

        if (currentEnrollment) {
          await tx.studentEnrollmentHistory.update({
            where: { id: currentEnrollment.id },
            data: {
              status: item.outcome,
              endDate: new Date(),
            },
          });
        }

        // หา targetGradeId และ targetClassroomId
        // PROMOTED → ใช้ค่าที่ส่งมา (ต้องระบุ targetGradeId)
        // REPEATED → ใช้ grade เดิมของนักเรียน (ส่ง targetGradeId ได้แต่ไม่บังคับ)
        // TRANSFERRED → ไม่ต้องการ grade/classroom
        let newGradeId: string = student.gradeId;
        let newClassId: string | null = null;

        if (item.outcome === EnrollmentStatus.PROMOTED) {
          if (!item.targetGradeId) {
            throw new BadRequestException(
              `targetGradeId is required for PROMOTED outcome (studentId: ${item.studentId})`,
            );
          }
          const targetGrade = await tx.grade.findUnique({
            where: { id: item.targetGradeId },
          });
          if (!targetGrade || !targetGrade.isActive) {
            throw new NotFoundException(
              `Target grade not found: ${item.targetGradeId}`,
            );
          }
          newGradeId = item.targetGradeId;
          newClassId = item.targetClassroomId ?? null;
        } else if (item.outcome === EnrollmentStatus.REPEATED) {
          // ซ้ำชั้น — อาจเปลี่ยนห้องได้ แต่ grade เดิม
          newGradeId = item.targetGradeId ?? student.gradeId;
          newClassId = item.targetClassroomId ?? null;
        } else if (item.outcome === EnrollmentStatus.TRANSFERRED) {
          // ย้ายออก — ล้าง classroom
          newGradeId = student.gradeId;
          newClassId = null;
        }

        // สร้าง enrollment ใหม่
        const newStatus =
          item.outcome === EnrollmentStatus.TRANSFERRED
            ? EnrollmentStatus.TRANSFERRED
            : EnrollmentStatus.ACTIVE;

        const newEnrollment = await tx.studentEnrollmentHistory.create({
          data: {
            studentId: item.studentId,
            gradeId: newGradeId,
            classroomId: newClassId,
            year: targetYear,
            term: targetTerm,
            status: newStatus,
            startDate: new Date(),
          },
          include: {
            student: true,
            grade: true,
            classroom: true,
          },
        });

        // อัปเดต student ปัจจุบัน
        await tx.student.update({
          where: { id: item.studentId },
          data: {
            gradeId: newGradeId,
            classId: newClassId,
          },
        });

        results.push(newEnrollment);
      }
    }, { timeout: 30000 });

    return {
      promoted: results.length,
      skipped: skippedStudentIds.length,
      results,
      skippedStudentIds,
    };
  }

  // ================================================
  // GET ENROLLMENT HISTORY
  // ================================================
  async getHistory(queryDto: EnrollmentHistoryQueryDto) {
    return this.prisma.studentEnrollmentHistory.findMany({
      where: {
        ...(queryDto.studentId && { studentId: queryDto.studentId }),
        ...(queryDto.gradeId && { gradeId: queryDto.gradeId }),
        ...(queryDto.classroomId && { classroomId: queryDto.classroomId }),
        ...(queryDto.year !== undefined && { year: queryDto.year }),
        ...(queryDto.term !== undefined && { term: queryDto.term }),
      },
      include: {
        student: true,
        grade: true,
        classroom: true,
      },
      orderBy: [{ year: 'desc' }, { term: 'desc' }],
    });
  }

  // ================================================
  // GET STUDENTS FOR PROMOTION
  // ================================================
  // ดึงนักเรียนใน grade/classroom + year/term ที่ระบุ
  // ถ้าระบุ year/term → ดูจาก EnrollmentHistory (ACTIVE)
  // ถ้าไม่ระบุ → ดูจาก student.gradeId / student.classId ปัจจุบัน
  async getStudentsForPromotion(
    gradeId?: string,
    classroomId?: string,
    year?: number,
    term?: number,
  ) {
    if (year !== undefined && term !== undefined) {
      // มี year+term → ดูจาก enrollment history ก่อน
      const enrollments = await this.prisma.studentEnrollmentHistory.findMany({
        where: {
          status: EnrollmentStatus.ACTIVE,
          ...(gradeId && { gradeId }),
          ...(classroomId && { classroomId }),
          year,
          term,
        },
        include: {
          student: true,
          grade: true,
          classroom: true,
        },
        orderBy: { student: { firstName: 'asc' } },
      });

      // ถ้ามี enrollment records → return ได้เลย
      if (enrollments.length > 0) {
        return enrollments;
      }
      // ถ้าไม่มี enrollment records (นักเรียนยังไม่เคยผ่าน promotion flow)
      // → fallback ไป query จาก student record โดยตรง
    }

    // ดูจาก student field โดยตรง
    const students = await this.prisma.student.findMany({
      where: {
        deletedAt: null,
        ...(gradeId && { gradeId }),
        ...(classroomId && { classId: classroomId }),
      },
      include: {
        grade: true,
        classroom: true,
      },
      orderBy: { firstName: 'asc' },
    });
    return students;
  }
}
