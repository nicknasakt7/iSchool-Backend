import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateGradeDto } from './dtos/create-grade.dto';
import { UpdateGradeDto } from './dtos/update-grade.dto';
import { CreateClassroomDto } from './dtos/create-classroom.dto';
import { UpdateClassroomDto } from './dtos/update-classroom.dto';

@Injectable()
export class ClassroomService {
  constructor(private prisma: PrismaService) {}

  // Grade
  createGrade(createGradeDto: CreateGradeDto) {
    return this.prisma.grade.create({
      data: createGradeDto,
    });
  }

  getGrades() {
    return this.prisma.grade.findMany({
      orderBy: { level: 'asc' },
    });
  }

  updateGrade(id: string, updateGradeDto: UpdateGradeDto) {
    return this.prisma.grade.update({
      where: { id },
      data: updateGradeDto,
    });
  }

  deleteGrade(id: string) {
    return this.prisma.grade.delete({
      where: { id },
    });
  }

  // Classroom
  createClassroom(createClassroomDto: CreateClassroomDto) {
    return this.prisma.classroom.create({
      data: {
        name: createClassroomDto.name,
        gradeId: createClassroomDto.gradeId,
      },
    });
  }

  getClassrooms(gradeId?: string) {
    return this.prisma.classroom.findMany({
      where: gradeId ? { gradeId } : undefined,
      include: {
        grade: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  updateClassroom(id: string, updateClassroomDto: UpdateClassroomDto) {
    return this.prisma.classroom.update({
      where: { id },
      data: updateClassroomDto,
    });
  }

  deleteClassroom(id: string) {
    return this.prisma.classroom.delete({
      where: { id },
    });
  }
}
