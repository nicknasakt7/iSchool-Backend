import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateScoreItemDto } from './dtos/create-score-item.dto';
import { CreateScoreDto } from './dtos/create-score.dto';
import { UpdateScoreDto } from './dtos/update-score.dto';

@Injectable()
export class ScoreService {
  constructor(private prisma: PrismaService) {}

  // ✅ create score
  async create(createScoreDto: CreateScoreDto) {
    return this.prisma.score.create({
      data: createScoreDto,
    });
  }

  // ✅ get by student
  async findByStudentId(studentId: string) {
    return this.prisma.score.findMany({
      where: { studentId },
      include: {
        subject: true,
        items: {
          include: {
            config: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ✅ update score
  async update(id: string, updateScoreDto: UpdateScoreDto) {
    return this.prisma.score.update({
      where: { id },
      data: updateScoreDto,
    });
  }

  // ✅ create score item
  async createOrUpdateScoreItem(createScoreItemDto: CreateScoreItemDto) {
    const { studentId, subjectId, configId, value } = createScoreItemDto;

    const assessmentConfig = await this.prisma.assessmentConfig.findUnique({
      where: { id: configId },
    });

    if (!assessmentConfig) {
      throw new Error();
    }

    // 1. upsert score
    const score = await this.prisma.score.upsert({
      where: {
        studentId_subjectId_term_year: {
          studentId,
          subjectId,
          term: assessmentConfig.term,
          year: assessmentConfig.year,
        },
      },
      update: {},
      create: {
        studentId,
        subjectId,
        term: assessmentConfig.term,
        year: assessmentConfig.year,
        totalScore: value,
      },
    });

    // 2. create score item
    await this.prisma.scoreItem.upsert({
      where: {
        scoreId_configId: {
          scoreId: score.id,
          configId,
        },
      },
      update: {
        value,
      },
      create: {
        scoreId: score.id,
        configId,
        value,
      },
    });

    const total = await this.prisma.scoreItem.aggregate({
      where: {
        scoreId: score.id,
      },
      _sum: {
        value: true,
      },
    });

    // 3. update totalScore
    return this.prisma.score.update({
      where: { id: score.id },
      data: {
        totalScore: total._sum.value || 0,
      },
      include: {
        items: true,
      },
    });
  }
}
