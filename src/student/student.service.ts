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

  // ใช้ nanoid generate studentCode แบบสั้น 6 ตัวอักษร + prefix ST-
  private generateStudentCode() {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
    return `ST-${nanoid()}`;
  }

  // CREATE STUDENT
  async create(createStudentDto: CreateStudentDto) {
    // ถ้า client ไม่ส่ง studentCode จะ generate อัตโนมัติ
    const studentCode =
      createStudentDto.studentCode || this.generateStudentCode();

    return this.prisma.student.create({
      data: {
        ...createStudentDto,
        studentCode, // ใส่ code ที่ generate
      },
      include: { parent: true, classroom: true },
    });
  }

  // GET ALL STUDENTS (exclude deleted)
  async findAll() {
    return this.prisma.student.findMany({
      where: { deletedAt: null },
      include: { parent: true, classroom: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // GET STUDENT BY ID
  async findOne(id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: { parent: true, classroom: true },
    });

    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  // UPDATE STUDENT
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

  // SOFT DELETE STUDENT
  async remove(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    if (student.deletedAt)
      throw new BadRequestException('Student already deleted');

    return this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: { parent: true, classroom: true },
    });
  }

  // GET STUDENTS BY GRADE
  async findByGrade(gradeId: string) {
    return this.prisma.student.findMany({
      where: { deletedAt: null, classroom: { gradeId } },
      include: { parent: true, classroom: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // GET STUDENTS BY CLASSROOM
  async findByClassroom(classroomId: string) {
    return this.prisma.student.findMany({
      where: { deletedAt: null, classId: classroomId },
      include: { parent: true, classroom: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  // SEARCH STUDENT
  async searchStudent(query: string) {
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

  // ASSIGN PARENT
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

  // REMOVE PARENT
  async removeParent(studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (!student.parentId)
      throw new BadRequestException('Student has no parent assigned');

    return this.prisma.student.update({
      where: { id: studentId },
      data: { parentId: null },
      include: { parent: true, classroom: true },
    });
  }
}
