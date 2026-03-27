import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateTeacherDto } from './dtos/create-teacher.dto';
import { UpdateTeacherDto } from './dtos/update-teacher.dto';
import { AssignSubjectDto } from './dtos/assign-subject.dto';

@Injectable()
export class TeacherService {
  constructor(private prisma: PrismaService) {}

  create(createTeacherDto: CreateTeacherDto) {
    return this.prisma.teacher.create({
      data: createTeacherDto,
    });
  }

  findAll() {
    return this.prisma.teacher.findMany({
      include: {
        user: true,
        homeroomClass: true,
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        homeroomClass: true,
        subjects: {
          include: {
            subject: true,
          },
        },
      },
    });
  }

  update(id: string, updateTeacherDto: UpdateTeacherDto) {
    return this.prisma.teacher.update({
      where: { id },
      data: updateTeacherDto,
    });
  }

  remove(id: string) {
    return this.prisma.teacher.delete({
      where: { id },
    });
  }

  async assignSubject(assignSubjectDto: AssignSubjectDto) {
    return this.prisma.subjectAssignment.create({
      data: assignSubjectDto,
    });
  }
}
