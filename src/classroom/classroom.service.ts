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

    const grade = await this.prisma.grade.findUnique({ where: { level } });

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

  private buildClassroomNameFromLevel(level: number, room: string): string {
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

  // Accepts unknown to safely convert Prisma / DTO error-typed fields to number | null
  private toNullableInt(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
  }

  private buildYearTermSuffix(
    year: number | null,
    term: number | null,
  ): string {
    if (year !== null && term !== null) return ` for year ${year} term ${term}`;
    if (year !== null) return ` for year ${year}`;
    if (term !== null) return ` for term ${term}`;
    return '';
  }

  // ---------------- Grade ----------------
  async createGrade(createGradeDto: CreateGradeDto): Promise<Grade> {
    return this.prisma.$transaction(async (tx) => {
      const grade = await tx.grade.create({ data: createGradeDto });

      const classroomName = `${grade.level}/1`;

      const existingClassroom = await tx.classroom.findFirst({
        where: { gradeId: grade.id, name: classroomName },
      });

      if (!existingClassroom) {
        await tx.classroom.create({
          data: { name: classroomName, gradeId: grade.id },
        });
      }

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

    // Normalize to number | null — aligns with Prisma Int? field type
    const year: number | null = createClassroomDto.year ?? null;
    const term: number | null = createClassroomDto.term ?? null;

    const existing = await this.prisma.classroom.findFirst({
      where: { gradeId, name: classroomName, year, term },
    });

    if (existing) {
      throw new BadRequestException(
        `Classroom "${classroomName}" already exists in this grade${this.buildYearTermSuffix(year, term)}`,
      );
    }

    return this.prisma.classroom.create({
      data: { name: classroomName, gradeId, year, term },
    });
  }

  async createManyClassrooms(
    createManyClassroomDto: CreateManyClassroomDto,
  ): Promise<{ count: number }> {
    for (const c of createManyClassroomDto.classrooms) {
      this.validateRoomNumber(c.name);
    }

    const mapped = await Promise.all(
      createManyClassroomDto.classrooms.map(
        async (
          c,
        ): Promise<{
          name: string;
          gradeId: string;
          year: number | null;
          term: number | null;
        }> => {
          const gradeId = await this.getGradeIdFromGradeName(c.gradeName);
          const classroomName = this.buildClassroomName(c.gradeName, c.name);
          // toNullableInt accepts unknown — avoids unsafe-assignment on decorated DTO fields
          return {
            name: classroomName,
            gradeId,
            year: this.toNullableInt(c.year),
            term: this.toNullableInt(c.term),
          };
        },
      ),
    );

    // Check for duplicates within the batch
    const hasBatchDuplicate = mapped.some(
      (c, i, arr) =>
        arr.findIndex(
          (x) =>
            x.gradeId === c.gradeId &&
            x.name === c.name &&
            x.year === c.year &&
            x.term === c.term,
        ) !== i,
    );

    if (hasBatchDuplicate) {
      throw new BadRequestException('Duplicate classroom names in request');
    }

    // Check for duplicates against existing DB records using all 4 fields
    const existingInDb = await this.prisma.classroom.findMany({
      where: {
        OR: mapped.map((c) => ({
          gradeId: c.gradeId,
          name: c.name,
          year: c.year,
          term: c.term,
        })),
      },
      select: { name: true, gradeId: true, year: true, term: true },
    });

    const conflicting = existingInDb.filter((db) =>
      mapped.some(
        (m) =>
          m.gradeId === db.gradeId &&
          m.name === db.name &&
          m.year === this.toNullableInt(db.year) &&
          m.term === this.toNullableInt(db.term),
      ),
    );

    if (conflicting.length > 0) {
      const conflicts = conflicting
        .map(
          (c) =>
            `"${c.name}"${this.buildYearTermSuffix(this.toNullableInt(c.year), this.toNullableInt(c.term))}`,
        )
        .join(', ');
      throw new BadRequestException(`Classrooms already exist: ${conflicts}`);
    }

    return this.prisma.classroom.createMany({
      data: mapped.map((c) => ({
        name: c.name,
        gradeId: c.gradeId,
        year: c.year,
        term: c.term,
      })),
      skipDuplicates: true,
    });
  }

  async getClassrooms(
    gradeId?: string,
    year?: number,
    term?: number,
  ): Promise<Classroom[]> {
    return this.prisma.classroom.findMany({
      where: {
        isActive: true,
        ...(gradeId !== undefined && { gradeId }),
        ...(year !== undefined && { year }),
        ...(term !== undefined && { term }),
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateClassroom(
    id: string,
    updateClassroomDto: UpdateClassroomDto,
  ): Promise<Classroom> {
    // Fetch without include so Prisma returns the plain Classroom model
    const classroom = await this.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    // toNullableInt accepts unknown — avoids unsafe-assignment on Prisma result fields
    const classroomYear: number | null = this.toNullableInt(classroom.year);
    const classroomTerm: number | null = this.toNullableInt(classroom.term);

    let newName: string | undefined;

    if (updateClassroomDto.name !== undefined) {
      this.validateRoomNumber(updateClassroomDto.name);

      // Fetch grade separately to get level for name building
      const grade = await this.prisma.grade.findUnique({
        where: { id: classroom.gradeId },
      });
      if (!grade) throw new NotFoundException('Grade not found');

      newName = this.buildClassroomNameFromLevel(
        grade.level,
        updateClassroomDto.name,
      );

      // Prevent duplicate: check if another classroom with same (gradeId, name, year, term) exists
      const duplicate = await this.prisma.classroom.findFirst({
        where: {
          gradeId: classroom.gradeId,
          name: newName,
          year: classroomYear,
          term: classroomTerm,
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          `Classroom "${newName}" already exists in this grade${this.buildYearTermSuffix(classroomYear, classroomTerm)}`,
        );
      }
    }

    return this.prisma.classroom.update({
      where: { id },
      data: {
        ...(newName !== undefined && { name: newName }),
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
