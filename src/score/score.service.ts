import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AppException } from 'src/common/exceptions/app-exception';
import { CreateScoreWithItemsDto } from './dtos/create-score-with-item.dto';
import { calculateGrade } from './utils/grade-util';

@Injectable()
export class ScoreService {
  constructor(private prisma: PrismaService) {}

  async upsertScoreWithItems(createScoreWithItemsDto: CreateScoreWithItemsDto) {
    const { studentId, subjectId, term, year, items, comment } =
      createScoreWithItemsDto;

    return this.prisma.$transaction(async (tx) => {
      // ==============================
      // 1. VALIDATE STUDENT
      // ==============================
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

      // ==============================
      // 2. VALIDATE SUBJECT
      // ==============================
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

      // ==============================
      // 3. GET CONFIGS
      // ==============================
      const configIds = items.map((i) => i.configId);

      const configs = await tx.assessmentConfig.findMany({
        where: {
          id: { in: configIds },
        },
      });

      if (configs.length !== items.length) {
        throw new AppException(
          'Some configs not found',
          'CONFIG_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      const configMap = new Map(configs.map((c) => [c.id, c]));

      // ==============================
      // 4. VALIDATE MAX SCORE
      // ==============================
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

      // ==============================
      // 5. UPSERT SCORE
      // ==============================
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

      // ==============================
      // 6. UPSERT SCORE ITEMS
      // ==============================
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

      // ==============================
      // 7. CALCULATE TOTAL SCORE
      // ==============================
      const total = await tx.scoreItem.aggregate({
        where: {
          scoreId: score.id,
        },
        _sum: {
          value: true,
        },
      });

      const totalScore = total._sum.value || 0;

      // ==============================
      // 8. VALIDATE TOTAL SCORE
      // ==============================
      if (totalScore > 100) {
        throw new AppException(
          'Total score cannot exceed 100',
          'TOTAL_SCORE_EXCEEDED',
          HttpStatus.BAD_REQUEST,
        );
      }

      // ==============================
      // 9. CALCULATE GRADE
      // ==============================
      const grade = calculateGrade(totalScore);

      // ==============================
      // 10. UPDATE FINAL SCORE
      // ==============================
      await tx.score.update({
        where: { id: score.id },
        data: {
          totalScore,
          subjectGrade: grade,
        },
      });

      // ==============================
      // 11. UPSERT COMMENT
      // ==============================
      // ==============================
      // 11. UPSERT COMMENT
      // ==============================
      if (comment) {
        await tx.teacherComment.upsert({
          where: {
            studentId_subjectId_term_year: {
              studentId,
              subjectId,
              term,
              year,
            },
          },
          update: {
            content: comment,
          },
          create: {
            studentId,
            subjectId,
            teacherId: 'TEMP_TEACHER_ID',
            term,
            year,
            content: comment, // ✅ ต้องเป็น content
          },
        });
      }

      // ==============================
      // 12. RETURN FINAL
      // ==============================
      return tx.score.findUnique({
        where: { id: score.id },
        include: {
          items: true,
        },
      });
    });
  }

  // ==============================
  // GET SCORES BY STUDENT
  // ==============================
  async findByStudentId(studentId: string) {
    return this.prisma.score.findMany({
      where: { studentId },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==============================
  // GET GPA
  // ==============================
  async getGPA(studentId: string, term: number, year: number) {
    const result = await this.prisma.score.aggregate({
      where: {
        studentId,
        term,
        year,
      },
      _avg: {
        subjectGrade: true,
      },
    });

    return {
      gpa: result._avg.subjectGrade || 0,
    };
  }
}
