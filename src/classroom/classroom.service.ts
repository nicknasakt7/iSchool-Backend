import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateGradeDto } from './dtos/create-grade.dto';
import { UpdateGradeDto } from './dtos/update-grade.dto';
import { CreateClassroomDto } from './dtos/create-classroom.dto';
import { UpdateClassroomDto } from './dtos/update-classroom.dto';
import { CreateManyClassroomDto } from './dtos/create-many-classroom.dto';

@Injectable()
export class ClassroomService {
  constructor(private prisma: PrismaService) {}

  // ---------------- Grade ----------------
  async createGrade(createGradeDto: CreateGradeDto) {
    return this.prisma.grade.create({ data: createGradeDto });
  }

  async getGrades() {
    return this.prisma.grade.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' },
    });
  }

  async updateGrade(id: string, updateGradeDto: UpdateGradeDto) {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) throw new NotFoundException('Grade not found');

    return this.prisma.grade.update({
      where: { id },
      data: updateGradeDto,
    });
  }

  async deleteGrade(id: string) {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) throw new NotFoundException('Grade not found');

    const classrooms = await this.prisma.classroom.count({
      where: { gradeId: id, isActive: true },
    });
    const students = await this.prisma.student.count({
      where: { gradeId: id, deletedAt: null },
    });
    const enrollments = await this.prisma.studentEnrollmentHistory.count({
      where: { gradeId: id },
    });
    const leads = await this.prisma.interestedLead.count({
      where: { gradeId: id, deletedAt: null },
    });

    if (classrooms || students || enrollments || leads) {
      throw new BadRequestException(
        'Cannot delete grade because there are related classrooms, students, enrollments, or leads.',
      );
    }

    return this.prisma.grade.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ---------------- Classroom ----------------
  async createClassroom(createClassroomDto: CreateClassroomDto) {
    return this.prisma.classroom.create({
      data: {
        name: createClassroomDto.name,
        gradeId: createClassroomDto.gradeId,
      },
    });
  }

  async createManyClassrooms(dto: CreateManyClassroomDto) {
    // ตรวจสอบ duplicate ใน batch
    const duplicateCheck = dto.classrooms.some(
      (c, i, arr) =>
        arr.findIndex((x) => x.gradeId === c.gradeId && x.name === c.name) !==
        i,
    );
    if (duplicateCheck) {
      throw new BadRequestException(
        'Duplicate classroom names for the same grade',
      );
    }

    return this.prisma.classroom.createMany({
      data: dto.classrooms.map((c) => ({
        name: c.name,
        gradeId: c.gradeId,
      })),
      skipDuplicates: true, // ป้องกัน error ถ้ามี unique constraint
    });
  }

  async getClassrooms(gradeId?: string) {
    return this.prisma.classroom.findMany({
      where: { isActive: true, ...(gradeId ? { gradeId } : {}) },
      include: { grade: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateClassroom(id: string, updateClassroomDto: UpdateClassroomDto) {
    const classroom = await this.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    return this.prisma.classroom.update({
      where: { id },
      data: updateClassroomDto,
    });
  }

  async deleteClassroom(id: string) {
    const classroom = await this.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    const students = await this.prisma.student.count({
      where: { classId: id, deletedAt: null },
    });
    const subjects = await this.prisma.subjectAssignment.count({
      where: { classId: id },
    });
    const enrollments = await this.prisma.studentEnrollmentHistory.count({
      where: { classroomId: id },
    });

    if (students || subjects || enrollments) {
      throw new BadRequestException(
        'Cannot delete classroom because there are related students, subjects, or enrollments.',
      );
    }

    return this.prisma.classroom.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
