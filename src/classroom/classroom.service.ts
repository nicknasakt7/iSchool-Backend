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

  // Accepts unknown to safely convert Prisma / DTO error-typed fields to number | null
  private toNullableInt(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
  }

  // ---------------- Grade ----------------

  async createGrade(createGradeDto: CreateGradeDto): Promise<Grade> {
    const existing = await this.prisma.grade.findFirst({
      where: {
        OR: [
          { name: createGradeDto.name },
          { level: createGradeDto.level },
        ],
        isActive: true,
      },
    });

    if (existing) {
      if (existing.name === createGradeDto.name) {
        throw new BadRequestException(
          `Grade "${createGradeDto.name}" already exists`,
        );
      }
      throw new BadRequestException(
        `Level ${createGradeDto.level} is already used by grade "${existing.name}"`,
      );
    }

    return this.prisma.grade.create({ data: createGradeDto });
  }

  async getGrades(year?: number, term?: number): Promise<Grade[]> {
    return this.prisma.grade.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' },
      include: {
        classrooms: {
          where: {
            isActive: true,
            ...(year !== undefined && { year }),
            ...(term !== undefined && { term }),
          },
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async getPublicGrades(): Promise<{ id: string; name: string; level: number }[]> {
    const grades = await this.prisma.grade.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' },
      select: { id: true, name: true, level: true },
    });
    return grades;
  }

  async updateGrade(
    id: string,
    updateGradeDto: UpdateGradeDto,
  ): Promise<Grade> {
    const grade = await this.prisma.grade.findUnique({ where: { id } });
    if (!grade) throw new NotFoundException('Grade not found');

    // Check name uniqueness if changing name
    if (updateGradeDto.name && updateGradeDto.name !== grade.name) {
      const duplicate = await this.prisma.grade.findFirst({
        where: { name: updateGradeDto.name, isActive: true, NOT: { id } },
      });
      if (duplicate) {
        throw new BadRequestException(
          `Grade "${updateGradeDto.name}" already exists`,
        );
      }
    }

    // Check level uniqueness if changing level
    if (updateGradeDto.level && updateGradeDto.level !== grade.level) {
      const duplicate = await this.prisma.grade.findFirst({
        where: { level: updateGradeDto.level, isActive: true, NOT: { id } },
      });
      if (duplicate) {
        throw new BadRequestException(
          `Level ${updateGradeDto.level} is already used`,
        );
      }
    }

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
      throw new BadRequestException(
        'Cannot delete grade: it still has active classrooms or students',
      );
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
    const grade = await this.prisma.grade.findUnique({
      where: { id: createClassroomDto.gradeId },
    });
    if (!grade || !grade.isActive) {
      throw new NotFoundException('Grade not found');
    }

    const name = createClassroomDto.name.trim();
    const year: number | null = createClassroomDto.year ?? null;
    const term: number | null = createClassroomDto.term ?? null;

    const existing = await this.prisma.classroom.findFirst({
      where: { gradeId: grade.id, name, year, term },
    });

    if (existing) {
      throw new BadRequestException(
        `Classroom "${name}" already exists in grade "${grade.name}"${this.buildYearTermSuffix(year, term)}`,
      );
    }

    return this.prisma.classroom.create({
      data: { name, gradeId: grade.id, year, term },
    });
  }

  async createManyClassrooms(
    createManyClassroomDto: CreateManyClassroomDto,
  ): Promise<{ count: number }> {
    const mapped = await Promise.all(
      createManyClassroomDto.classrooms.map(async (c) => {
        const grade = await this.prisma.grade.findUnique({
          where: { id: c.gradeId },
        });
        if (!grade || !grade.isActive) {
          throw new NotFoundException(`Grade not found: ${c.gradeId}`);
        }
        return {
          name: c.name.trim(),
          gradeId: grade.id,
          year: this.toNullableInt(c.year),
          term: this.toNullableInt(c.term),
        };
      }),
    );

    // Check duplicates within batch
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

    // Check duplicates against DB
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

    if (existingInDb.length > 0) {
      const conflicts = existingInDb
        .map(
          (c) =>
            `"${c.name}"${this.buildYearTermSuffix(this.toNullableInt(c.year), this.toNullableInt(c.term))}`,
        )
        .join(', ');
      throw new BadRequestException(`Classrooms already exist: ${conflicts}`);
    }

    return this.prisma.classroom.createMany({
      data: mapped,
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
    const classroom = await this.prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    // Check name uniqueness within same grade+year+term scope
    if (updateClassroomDto.name !== undefined) {
      const newName = updateClassroomDto.name.trim();
      const duplicate = await this.prisma.classroom.findFirst({
        where: {
          gradeId: classroom.gradeId,
          name: newName,
          year: this.toNullableInt(classroom.year),
          term: this.toNullableInt(classroom.term),
          NOT: { id },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          `Classroom "${newName}" already exists in this grade${this.buildYearTermSuffix(
            this.toNullableInt(classroom.year),
            this.toNullableInt(classroom.term),
          )}`,
        );
      }

      updateClassroomDto = { ...updateClassroomDto, name: newName };
    }

    return this.prisma.classroom.update({
      where: { id },
      data: {
        ...(updateClassroomDto.name !== undefined && {
          name: updateClassroomDto.name,
        }),
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

  // ---------------- Helpers ----------------

  private buildYearTermSuffix(
    year: number | null,
    term: number | null,
  ): string {
    if (year !== null && term !== null) return ` for year ${year} term ${term}`;
    if (year !== null) return ` for year ${year}`;
    if (term !== null) return ` for term ${term}`;
    return '';
  }
}
