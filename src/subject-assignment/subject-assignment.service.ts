import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateConfigDto } from 'src/subject/dtos/request/create-config.dto';

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
