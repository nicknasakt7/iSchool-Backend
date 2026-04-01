import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateConfigDto } from '../subject/dtos/create-config.dto';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class SubjectAssignmentService {
  constructor(private prisma: PrismaService) {}

  private async checkAssignment(id: string) {
    const assignment = await this.prisma.subjectAssignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      throw new NotFoundException('Subject assignment not found');
    }

    return assignment;
  }

  async createSubjectConfig(assignmentId: string, dto: CreateConfigDto) {
    await this.checkAssignment(assignmentId);

    return this.prisma.assessmentConfig.create({
      data: {
        ...dto,
        subjectAssignmentId: assignmentId, // ⭐ ของใหม่
      },
    });
  }

  async getSubjectConfigs(assignmentId: string) {
    await this.checkAssignment(assignmentId);

    return this.prisma.assessmentConfig.findMany({
      where: { subjectAssignmentId: assignmentId },
      orderBy: { order: 'asc' },
    });
  }
}
