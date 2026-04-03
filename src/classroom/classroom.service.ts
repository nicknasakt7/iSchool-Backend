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

  // ---------------- MAP ----------------
  private readonly gradeLevelMap: Record<string, number> = {
    'P.1': 1,
    'P.2': 2,
    'P.3': 3,
    'P.4': 4,
    'P.5': 5,
    'P.6': 6,
  };

  private normalizeGradeName(gradeName: string): string {
    const value = gradeName.trim().toUpperCase();
    const matched = value.match(/^P\.?([1-6])$/);

    if (matched) {
      return `P.${matched[1]}`;
    }

    return value;
  }

  private async getGradeIdFromGradeName(gradeName: string): Promise<string> {
    const normalized = this.normalizeGradeName(gradeName);
    const level = this.gradeLevelMap[normalized];

    if (!level) {
      throw new BadRequestException(`Invalid gradeName: ${gradeName}`);
    }

    const grade = await this.prisma.grade.findUnique({
      where: { level },
    });

    if (!grade) {
      throw new NotFoundException(`Grade not found: ${normalized}`);
    }

    return grade.id;
  }

  // 🔥 ตัวสำคัญ: build classroom name
  private buildClassroomName(gradeName: string, room: string): string {
    const normalized = this.normalizeGradeName(gradeName);
    const level = this.gradeLevelMap[normalized];

    if (!level) {
      throw new BadRequestException(`Invalid gradeName: ${gradeName}`);
    }

    const roomNumber = room.trim();

    if (!roomNumber) {
      throw new BadRequestException('Room number is required');
    }

    return `${level}/${roomNumber}`;
  }

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

    if (classrooms || students) {
      throw new BadRequestException('Cannot delete grade');
    }

    return this.prisma.grade.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ---------------- Classroom ----------------
  async createClassroom(dto: CreateClassroomDto) {
    const gradeId = await this.getGradeIdFromGradeName(dto.gradeName);

    const classroomName = this.buildClassroomName(
      dto.gradeName,
      dto.name, // <-- ใช้ name เป็น roomNumber
    );

    return this.prisma.classroom.create({
      data: {
        name: classroomName,
        gradeId,
      },
    });
  }

  async createManyClassrooms(dto: CreateManyClassroomDto) {
    const mapped = await Promise.all(
      dto.classrooms.map(async (c) => {
        const gradeId = await this.getGradeIdFromGradeName(c.gradeName);

        const classroomName = this.buildClassroomName(c.gradeName, c.name);

        return {
          name: classroomName,
          gradeId,
        };
      }),
    );

    const duplicateCheck = mapped.some(
      (c, i, arr) =>
        arr.findIndex((x) => x.gradeId === c.gradeId && x.name === c.name) !==
        i,
    );

    if (duplicateCheck) {
      throw new BadRequestException('Duplicate classroom names');
    }

    return this.prisma.classroom.createMany({
      data: mapped,
      skipDuplicates: true,
    });
  }

  async getClassrooms(gradeId?: string) {
    return this.prisma.classroom.findMany({
      where: { isActive: true, ...(gradeId ? { gradeId } : {}) },
      include: { grade: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateClassroom(id: string, dto: UpdateClassroomDto) {
    const classroom = await this.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    return this.prisma.classroom.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteClassroom(id: string) {
    const classroom = await this.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    const students = await this.prisma.student.count({
      where: { classId: id, deletedAt: null },
    });

    if (students) {
      throw new BadRequestException('Cannot delete classroom');
    }

    return this.prisma.classroom.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
