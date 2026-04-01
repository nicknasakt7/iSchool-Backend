import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

import { AppException } from 'src/common/exceptions/app-exception';
import { CreateScoreWithItemsDto } from 'src/score/dtos/create-score-with-item.dto';
import { calculateGrade } from 'src/score/utils/grade-util';

@Injectable()
export class ScoreService {
  constructor(private prisma: PrismaService) {}

  async upsertScoreWithItems(createScoreWithItemsDto: CreateScoreWithItemsDto) {
    const { studentId, subjectId, term, year, items } = createScoreWithItemsDto;

    return this.prisma.$transaction(async (tx) => {
      // validate student
      const student = await tx.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        throw new AppException(
          'Student not found',
          'STUDENT_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      //  validate subject
      const subject = await tx.subject.findUnique({
        where: { id: subjectId },
      });

      if (!subject) {
        throw new AppException(
          'Subject not found',
          'SUBJECT_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      // 1. ดึง config
      const configIds = items.map((i) => i.configId);

      const configs = await tx.assessmentConfig.findMany({
        where: { id: { in: configIds } },
      });

      if (configs.length !== items.length) {
        throw new AppException(
          'Some configs not found',
          'CONFIG_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      const configMap = new Map(configs.map((c) => [c.id, c]));

      // 2. validate score ไม่เกิน max
      for (const item of items) {
        const config = configMap.get(item.configId);

        if (!config) continue;

        if (item.value > config.maxScore) {
          throw new AppException(
            `Score exceeds maxScore for ${config.name}`,
            'SCORE_EXCEEDS_MAX',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // 3. upsert score
      const score = await tx.score.upsert({
        where: {
          studentId_subjectId_term_year: {
            studentId,
            subjectId,
            term,
            year,
          },
        },
        update: {},
        create: {
          studentId,
          subjectId,
          term,
          year,
          totalScore: 0,
        },
      });

      // 4. upsert items
      for (const item of items) {
        await tx.scoreItem.upsert({
          where: {
            scoreId_configId: {
              scoreId: score.id,
              configId: item.configId,
            },
          },
          update: {
            value: item.value,
          },
          create: {
            scoreId: score.id,
            configId: item.configId,
            value: item.value,
          },
        });
      }

      // 5. sum total
      const total = await tx.scoreItem.aggregate({
        where: { scoreId: score.id },
        _sum: { value: true },
      });

      const totalScore = total._sum.value || 0;

      if (totalScore > 100) {
        throw new AppException(
          'Total score cannot exceed 100',
          'TOTAL_SCORE_EXCEEDED',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 6. calculate grade
      const grade = calculateGrade(totalScore);

      // 7. update final
      return tx.score.update({
        where: { id: score.id },
        data: {
          totalScore,
          subjectGrade: grade,
        },
        include: {
          items: true,
        },
      });
    });
  }
}
