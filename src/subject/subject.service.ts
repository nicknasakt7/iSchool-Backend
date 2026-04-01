import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateSubjectDto } from './dtos/create-subject.dto';
import { UpdateSubjectDto } from './dtos/update-subject.dto';
import { CreateConfigDto } from './dtos/create-config.dto';

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) {}

  private async checkSubject(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
  }

  // Create Subject (Admin)
  async create(createSubjectDto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: createSubjectDto,
    });
  }

  // Get all subject (All)
  async findAll() {
    return this.prisma.subject.findMany({
      include: {
        configs: true,
      },
    });
  }

  // Update subject (Admin)
  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    await this.checkSubject(id);

    return this.prisma.subject.update({
      where: { id },
      data: updateSubjectDto,
    });
  }

  // Delete subject (Admin)
  async remove(id: string) {
    await this.checkSubject(id);

    return this.prisma.subject.delete({
      where: { id },
    });
  }

  // Create config (เพิ่มช่องคะแนน)
  async createConfig(subjectId: string, createSubjectDto: CreateConfigDto) {
    await this.checkSubject(subjectId);

    return this.prisma.assessmentConfig.create({
      data: {
        ...createSubjectDto,
        subjectId,
      },
    });
  }

  // GET CONFIG
  async getConfigs(subjectId: string) {
    await this.checkSubject(subjectId);

    return this.prisma.assessmentConfig.findMany({
      where: { subjectId },
      orderBy: { order: 'asc' },
    });
  }
}
