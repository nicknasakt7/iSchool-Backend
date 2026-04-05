import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { Grade, Classroom } from 'src/database/generated/prisma/client';
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

  private buildClassroomName(gradeName: string, room: string): string {
    const normalized = this.normalizeGradeName(gradeName);
    const level = this.gradeLevelMap[normalized];

    if (!level) {
      throw new BadRequestException(`Invalid gradeName: ${gradeName}`);
    }

    const roomTrimmed = room.trim();

    if (!roomTrimmed) {
      throw new BadRequestException('Room number is required');
    }

    return `${level}/${roomTrimmed}`;
  }

  private validateRoomNumber(room: string): void {
    const trimmed = room.trim();

    if (!trimmed) {
      throw new BadRequestException('Room number is required');
    }

    if (!/^\d+$/.test(trimmed)) {
      throw new BadRequestException(
        `Room number must be numeric, got: "${trimmed}"`,
      );
    }

    const num = parseInt(trimmed, 10);
    if (num <= 0) {
      throw new BadRequestException('Room number must be greater than 0');
    }
  }

  // ---------------- Grade ----------------
  async createGrade(createGradeDto: CreateGradeDto): Promise<Grade> {
    return this.prisma.$transaction(async (tx) => {
      const grade = await tx.grade.create({ data: createGradeDto });

      const classroomName = `${grade.level}/1`;

      await tx.classroom.upsert({
        where: { name_gradeId: { name: classroomName, gradeId: grade.id } },
        update: {},
        create: { name: classroomName, gradeId: grade.id },
      });

      return grade;
    });
  }

  async getGrades(): Promise<Grade[]> {
    return this.prisma.grade.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' },
    });
  }

  async updateGrade(
    id: string,
    updateGradeDto: UpdateGradeDto,
  ): Promise<Grade> {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) throw new NotFoundException('Grade not found');

    return this.prisma.grade.update({
      where: { id },
      data: updateGradeDto,
    });
  }

  async deleteGrade(id: string): Promise<Grade> {
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
  async createClassroom(
    createClassroomDto: CreateClassroomDto,
  ): Promise<Classroom> {
    this.validateRoomNumber(createClassroomDto.name);

    const gradeId = await this.getGradeIdFromGradeName(
      createClassroomDto.gradeName,
    );

    const classroomName = this.buildClassroomName(
      createClassroomDto.gradeName,
      createClassroomDto.name,
    );

    const existing = await this.prisma.classroom.findUnique({
      where: { name_gradeId: { name: classroomName, gradeId } },
    });

    if (existing) {
      throw new BadRequestException(
        `Classroom "${classroomName}" already exists in this grade`,
      );
    }

    return this.prisma.classroom.create({
      data: { name: classroomName, gradeId },
    });
  }

  async createManyClassrooms(
    createManyClassroomDto: CreateManyClassroomDto,
  ): Promise<{ count: number }> {
    for (const c of createManyClassroomDto.classrooms) {
      this.validateRoomNumber(c.name);
    }

    const mapped = await Promise.all(
      createManyClassroomDto.classrooms.map(async (c) => {
        const gradeId = await this.getGradeIdFromGradeName(c.gradeName);
        const classroomName = this.buildClassroomName(c.gradeName, c.name);
        return { name: classroomName, gradeId };
      }),
    );

    // Check for duplicates within the batch
    const hasBatchDuplicate = mapped.some(
      (c, i, arr) =>
        arr.findIndex((x) => x.gradeId === c.gradeId && x.name === c.name) !==
        i,
    );

    if (hasBatchDuplicate) {
      throw new BadRequestException('Duplicate classroom names in request');
    }

    // Check for duplicates against existing DB records
    const existingNames = mapped.map((c) => c.name);
    const existingInDb = await this.prisma.classroom.findMany({
      where: { name: { in: existingNames } },
      select: { name: true },
    });

    if (existingInDb.length > 0) {
      const conflicts = existingInDb.map((c) => c.name).join(', ');
      throw new BadRequestException(`Classrooms already exist: ${conflicts}`);
    }

    return this.prisma.classroom.createMany({
      data: mapped,
      skipDuplicates: true,
    });
  }

  async getClassrooms(gradeId?: string): Promise<Classroom[]> {
    return this.prisma.classroom.findMany({
      where: {
        isActive: true,
        ...(gradeId && { gradeId }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateClassroom(
    id: string,
    updateClassroomDto: UpdateClassroomDto,
  ): Promise<Classroom> {
    const classroom = await this.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    return this.prisma.classroom.update({
      where: { id },
      data: {
        ...(updateClassroomDto.name && { name: updateClassroomDto.name }),
        ...(updateClassroomDto.isActive !== undefined && {
          isActive: updateClassroomDto.isActive,
        }),
      },
    });
  }

  async deleteClassroom(id: string): Promise<Classroom> {
    const classroom = await this.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    const students = await this.prisma.student.count({
      where: { classId: id, deletedAt: null },
    });

    if (students) {
      throw new BadRequestException(
        'Cannot delete classroom: it still has active students',
      );
    }

    const activeClassroomsInGrade = await this.prisma.classroom.count({
      where: { gradeId: classroom.gradeId, isActive: true },
    });

    if (activeClassroomsInGrade <= 1) {
      throw new BadRequestException(
        'Cannot delete the last active classroom of a grade',
      );
    }

    return this.prisma.classroom.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
