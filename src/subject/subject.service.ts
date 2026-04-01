import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateSubjectDto } from './dtos/create-subject.dto';
import { UpdateSubjectDto } from './dtos/update-subject.dto';

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

    return subject;
  }

  // ==============================
  // CREATE SUBJECT (ADMIN)
  // ==============================
  async create(createSubjectDto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: createSubjectDto,
    });
  }

  // ==============================
  // GET ALL SUBJECTS (ALL)
  // ==============================
  async findAll() {
    return this.prisma.subject.findMany();
  }

  // ==============================
  // UPDATE SUBJECT (ADMIN)
  // ==============================
  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    await this.checkSubject(id);

    return this.prisma.subject.update({
      where: { id },
      data: updateSubjectDto,
    });
  }

  // ==============================
  // DELETE SUBJECT (ADMIN)
  // ==============================
  async remove(id: string) {
    await this.checkSubject(id);

    return this.prisma.subject.delete({
      where: { id },
    });
  }
}
