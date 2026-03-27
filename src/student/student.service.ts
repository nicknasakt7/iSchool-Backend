import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateStudentDto } from './dtos/create-student.dto';
import { UpdateStudentDto } from './dtos/update-student.dto';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async create(createStudentDto: CreateStudentDto) {
    return this.prisma.student.create({
      data: createStudentDto,
    });
  }

  async findAll() {
    return this.prisma.student.findMany({
      include: {
        classroom: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      include: {
        classroom: true,
      },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    return this.prisma.student.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.student.delete({
      where: { id },
    });
  }

  async findByGrade(gradeId: string) {
    return this.prisma.student.findMany({
      where: {
        classroom: {
          gradeId: gradeId,
        },
      },
      include: {
        classroom: true,
        parent: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findByClassroom(classroomId: string) {
    return this.prisma.student.findMany({
      where: {
        classId: classroomId,
      },
      include: {
        parent: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async searchStudent(query: string) {
    return this.prisma.student.findMany({
      where: {
        OR: [
          {
            firstName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            studentCode: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        classroom: true,
        parent: true,
      },
    });
  }
}
