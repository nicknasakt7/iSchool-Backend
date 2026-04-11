import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateLeadDto } from './dtos/create-lead.dto';
import { UpdateLeadStatusDto } from './dtos/update-lead-status.dto';

@Injectable()
export class LeadService {
  constructor(private prisma: PrismaService) {}

  async create(createLeadDto: CreateLeadDto) {
    const grade = await this.prisma.grade.findUnique({
      where: { id: createLeadDto.gradeId },
    });
    if (!grade || !grade.isActive) {
      throw new BadRequestException('Grade not found or inactive');
    }

    return this.prisma.interestedLead.create({
      data: createLeadDto,
      include: { grade: { select: { id: true, name: true, level: true } } },
    });
  }

  async findAll(status?: string) {
    return this.prisma.interestedLead.findMany({
      where: {
        deletedAt: null,
        ...(status ? { status: status as any } : {}),
      },
      include: { grade: { select: { id: true, name: true, level: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, updateLeadStatusDto: UpdateLeadStatusDto) {
    const lead = await this.prisma.interestedLead.findFirst({
      where: { id, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    return this.prisma.interestedLead.update({
      where: { id },
      data: { status: updateLeadStatusDto.status },
      include: { grade: { select: { id: true, name: true, level: true } } },
    });
  }

  async remove(id: string) {
    const lead = await this.prisma.interestedLead.findFirst({
      where: { id, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    await this.prisma.interestedLead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
