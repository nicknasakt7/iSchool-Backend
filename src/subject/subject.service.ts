import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateSubjectDto } from './dtos/request/create-subject.dto';
import { CreateManySubjectDto } from './dtos/request/create-many-subject.dto';
import { UpdateSubjectDto } from './dtos/request/update-subject.dto';

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  private async checkSubject(id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return subject;
  }

  // ==============================
  // CREATE SUBJECT (ADMIN)
  // ==============================
  async create(createSubjectDto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        name: createSubjectDto.name.trim(),
      },
    });
  }

  // ==============================
  // CREATE MANY SUBJECTS (ADMIN)
  // ==============================
  async createMany(createManySubjectDto: CreateManySubjectDto) {
    const normalizedNames = createManySubjectDto.subjects
      .map((item) => item.name.trim())
      .filter((name) => name.length > 0);

    if (normalizedNames.length === 0) {
      throw new BadRequestException('At least one subject name is required');
    }

    const uniqueNames = [...new Set(normalizedNames)];

    const existingSubjects = await this.prisma.subject.findMany({
      where: {
        name: {
          in: uniqueNames,
        },
        deletedAt: null,
      },
      select: {
        name: true,
      },
    });

    const existingNames = new Set(existingSubjects.map((item) => item.name));
    const newNames = uniqueNames.filter((name) => !existingNames.has(name));

    if (newNames.length === 0) {
      throw new BadRequestException('All subjects already exist');
    }

    await this.prisma.subject.createMany({
      data: newNames.map((name) => ({ name })),
    });

    return this.prisma.subject.findMany({
      where: {
        name: {
          in: newNames,
        },
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==============================
  // GET ALL SUBJECTS (ALL)
  // ==============================
  async findAll() {
    return this.prisma.subject.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // ==============================
  // UPDATE SUBJECT (ADMIN)
  // ==============================
  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    await this.checkSubject(id);

    return this.prisma.subject.update({
      where: { id },
      data: {
        ...(updateSubjectDto.name && { name: updateSubjectDto.name.trim() }),
      },
    });
  }

  // ==============================
  // SOFT DELETE SUBJECT (ADMIN)
  // ==============================
  async remove(id: string) {
    await this.checkSubject(id);

    return this.prisma.subject.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
