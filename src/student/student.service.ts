import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateStudentDto } from './dtos/create-student.dto';
import { UpdateStudentDto } from './dtos/update-student.dto';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    return this.prisma.student.create({
      data: {
        studentCode: dto.studentCode,
        firstName: dto.firstName,
        lastName: dto.lastName,
        nickName: dto.nickName,
        dob: new Date(dto.dob), // Convert string to Date object
        classroom: {
          connect: { id: dto.classId }, // Using `classroomId` as a foreign key
        },
        healthNote: dto.healthNote,
        favorite: dto.favorite,
      },
    });
  }

  async findAll() {
    return this.prisma.student.findMany({
      include: {
        classroom: true,
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
}
