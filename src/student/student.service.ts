import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateStudentDto } from './dtos/create-student.dto';
import { UpdateStudentDto } from './dtos/update-student.dto';
import { customAlphabet } from 'nanoid';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  private generateStudentCode() {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
    return `ST-${nanoid()}`;
  }

  async create(createStudentDto: CreateStudentDto) {
    const studentCode =
      createStudentDto.studentCode || this.generateStudentCode();

    return this.prisma.student.create({
      data: {
        ...createStudentDto,
        studentCode,
      },
      include: { parent: true, classroom: true },
    });
  }

  async findAll() {
    return this.prisma.student.findMany({
      where: { deletedAt: null },
      include: { parent: true, classroom: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: { parent: true, classroom: true },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
    });

    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: { parent: true, classroom: true },
    });
  }

  async remove(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { parent: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.deletedAt) {
      throw new BadRequestException('Student already deleted');
    }

    if (student.parentId) {
      throw new BadRequestException(
        'Cannot delete student while parent is still assigned',
      );
    }

    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { parent: true, classroom: true },
    });
  }

  async findByGrade(gradeId: string) {
    return this.prisma.student.findMany({
      where: { deletedAt: null, gradeId },
      include: { parent: true, classroom: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByClassroom(classroomId: string) {
    return this.prisma.student.findMany({
      where: { deletedAt: null, classId: classroomId },
      include: { parent: true, classroom: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async searchStudent(query: string) {
    if (!query?.trim()) {
      throw new BadRequestException('query is required');
    }

    return this.prisma.student.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { studentCode: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { parent: true, classroom: true },
    });
  }

  async assignParent(studentId: string, parentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) throw new NotFoundException('Student not found');

    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (!parent) throw new NotFoundException('Parent not found');

    return this.prisma.student.update({
      where: { id: studentId },
      data: { parentId },
      include: { parent: true, classroom: true },
    });
  }

  async removeParent(studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) throw new NotFoundException('Student not found');

    if (!student.parentId) {
      throw new BadRequestException('Student has no parent assigned');
    }

    return this.prisma.student.update({
      where: { id: studentId },
      data: { parentId: null },
      include: { parent: true, classroom: true },
    });
  }
}
