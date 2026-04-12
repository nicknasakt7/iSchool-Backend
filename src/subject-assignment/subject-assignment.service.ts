import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateConfigDto } from 'src/subject/dtos/request/create-config.dto';
import { FindAssignmentQueryDto } from './dtos/find-assignment-query.dto';

@Injectable()
export class SubjectAssignmentService {
  constructor(private prisma: PrismaService) {}

  // ==============================
  // CHECK ASSIGNMENT EXISTS
  // ==============================
  private async checkAssignment(id: string) {
    const assignment = await this.prisma.subjectAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Subject assignment not found');
    }

    return assignment;
  }

  // ==============================
  // CREATE CONFIG (กันซ้ำ + กัน order ซ้ำ)
  // ==============================
  async createSubjectConfig(
    assignmentId: string,
    createConfigDto: CreateConfigDto,
  ) {
    await this.checkAssignment(assignmentId);

    const { name, year, term, order } = createConfigDto;

    // กันชื่อซ้ำในเทอมเดียวกัน
    const existingName = await this.prisma.assessmentConfig.findFirst({
      where: {
        subjectAssignmentId: assignmentId,
        name,
        year,
        term,
      },
    });

    if (existingName) {
      throw new BadRequestException('Config name already exists');
    }

    // กัน order ซ้ำ
    const existingOrder = await this.prisma.assessmentConfig.findFirst({
      where: {
        subjectAssignmentId: assignmentId,
        order,
        year,
        term,
      },
    });

    if (existingOrder) {
      throw new BadRequestException('Config order already exists');
    }

    return this.prisma.assessmentConfig.create({
      data: {
        ...createConfigDto,
        subjectAssignmentId: assignmentId,
      },
    });
  }

  // ==============================
  // FIND ASSIGNMENT BY CLASSROOM + SUBJECT
  // ==============================
  async findByClassroomAndSubject(
    findAssignmentQueryDto: FindAssignmentQueryDto,
  ) {
    const { classroomId, subjectId } = findAssignmentQueryDto;

    const assignment = await this.prisma.subjectAssignment.findFirst({
      where: { classId: classroomId, subjectId },
      select: { id: true, classId: true, subjectId: true },
    });

    if (!assignment) {
      throw new NotFoundException(
        'No subject assignment found for this classroom and subject',
      );
    }

    return assignment;
  }

  // ==============================
  // GET ALL SUBJECTS BY CLASSROOM
  // Returns subject assignments with subject info for a given classroom
  // ==============================
  async getSubjectsByClassroom(classroomId: string) {
    return this.prisma.subjectAssignment.findMany({
      where: { classId: classroomId, deletedAt: null },
      select: {
        id: true,
        subjectId: true,
        subject: { select: { id: true, name: true } },
      },
      orderBy: { subject: { name: 'asc' } },
    });
  }

  // ==============================
  // DELETE SUBJECT ASSIGNMENT (soft-delete)
  // ==============================
  async deleteSubjectAssignment(id: string): Promise<void> {
    const assignment = await this.prisma.subjectAssignment.findUnique({
      where: { id },
    });

    if (!assignment || assignment.deletedAt !== null) {
      throw new NotFoundException('Subject assignment not found');
    }

    await this.prisma.subjectAssignment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==============================
  // GET CONFIGS (เรียงลำดับ)
  // ==============================
  async getSubjectConfigs(assignmentId: string) {
    await this.checkAssignment(assignmentId);

    return this.prisma.assessmentConfig.findMany({
      where: { subjectAssignmentId: assignmentId },
      orderBy: { order: 'asc' },
    });
  }
}
