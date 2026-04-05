import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AppException } from 'src/common/exceptions/app-exception';
import { calculateGrade } from 'src/score/utils/grade-util';
import { GetConfigQueryDto } from './dto/request/get-config-query.dto';
import { UpsertConfigDto } from './dto/request/upsert-config.dto';
import { ApplyConfigDto } from './dto/request/apply-config.dto';
import { UpdateScoreItemDto } from './dto/request/update-score-item.dto';

@Injectable()
export class AssessmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ==============================
  // GET CONFIG
  // ==============================
  async getConfig(query: GetConfigQueryDto) {
    const { classroomId, subjectId, term, year } = query;

    const assignment = await this.prisma.subjectAssignment.findFirst({
      where: { classId: classroomId, subjectId },
    });

    if (!assignment) {
      throw new AppException(
        'Subject assignment not found for this classroom and subject',
        'ASSIGNMENT_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.assessmentConfig.findMany({
      where: { subjectAssignmentId: assignment.id, term, year },
      orderBy: { order: 'asc' },
    });
  }

  // ==============================
  // UPSERT CONFIG
  // ==============================
  async upsertConfig(upsertConfigDto: UpsertConfigDto) {
    const { subjectAssignmentId, term, year, items } = upsertConfigDto;

    // Validate total maxScore <= 100
    const totalMaxScore = items.reduce((sum, item) => sum + item.maxScore, 0);
    if (totalMaxScore > 100) {
      throw new AppException(
        `Total maxScore (${totalMaxScore}) exceeds 100`,
        'MAX_SCORE_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate assignment exists and grab subjectId for backwards compat
    const assignment = await this.prisma.subjectAssignment.findUnique({
      where: { id: subjectAssignmentId },
    });

    if (!assignment) {
      throw new AppException(
        'Subject assignment not found',
        'ASSIGNMENT_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const existingConfigs = await tx.assessmentConfig.findMany({
        where: { subjectAssignmentId, term, year },
        select: { id: true },
      });

      if (existingConfigs.length > 0) {
        const existingConfigIds = existingConfigs.map((c) => c.id);

        // Collect affected score IDs before deleting items
        const affectedItems = await tx.scoreItem.findMany({
          where: { configId: { in: existingConfigIds } },
          select: { scoreId: true },
        });
        const affectedScoreIds = [
          ...new Set(affectedItems.map((si) => si.scoreId)),
        ];

        // Delete score items first (FK constraint)
        await tx.scoreItem.deleteMany({
          where: { configId: { in: existingConfigIds } },
        });

        // Zero out scores that lost their items
        if (affectedScoreIds.length > 0) {
          await tx.score.updateMany({
            where: { id: { in: affectedScoreIds } },
            data: { totalScore: 0, subjectGrade: 0 },
          });
        }

        // Delete old configs
        await tx.assessmentConfig.deleteMany({
          where: { subjectAssignmentId, term, year },
        });
      }

      // Create new configs
      await tx.assessmentConfig.createMany({
        data: items.map((item) => ({
          subjectAssignmentId,
          subjectId: assignment.subjectId,
          term,
          year,
          name: item.name,
          maxScore: item.maxScore,
          order: item.order,
        })),
      });

      return tx.assessmentConfig.findMany({
        where: { subjectAssignmentId, term, year },
        orderBy: { order: 'asc' },
      });
    });
  }

  // ==============================
  // APPLY CONFIG TO STUDENTS
  // ==============================
  async applyConfig(applyConfigDto: ApplyConfigDto) {
    const { subjectAssignmentId, classroomId, subjectId, term, year } = applyConfigDto;

    return this.prisma.$transaction(async (tx) => {
      // Get active students in classroom
      const students = await tx.student.findMany({
        where: { classId: classroomId, deletedAt: null },
        select: { id: true },
      });

      if (students.length === 0) {
        throw new AppException(
          'No students found in this classroom',
          'NO_STUDENTS_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      // Get configs for this assignment/term/year
      const configs = await tx.assessmentConfig.findMany({
        where: { subjectAssignmentId, term, year },
        select: { id: true },
      });

      if (configs.length === 0) {
        throw new AppException(
          'No assessment config found for this assignment, term and year. Create a config first.',
          'CONFIG_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      let applied = 0;
      for (const student of students) {
        // Upsert Score record
        const score = await tx.score.upsert({
          where: {
            studentId_subjectId_term_year: {
              studentId: student.id,
              subjectId,
              term,
              year,
            },
          },
          update: {},
          create: {
            studentId: student.id,
            subjectId,
            term,
            year,
            totalScore: 0,
            subjectGrade: 0,
          },
        });

        // Upsert ScoreItem per config — preserve existing values on update
        for (const config of configs) {
          await tx.scoreItem.upsert({
            where: {
              scoreId_configId: {
                scoreId: score.id,
                configId: config.id,
              },
            },
            update: {},
            create: {
              scoreId: score.id,
              configId: config.id,
              value: 0,
            },
          });
        }

        applied++;
      }

      return {
        studentsCount: students.length,
        configsCount: configs.length,
        applied,
      };
    });
  }

  // ==============================
  // UPDATE SCORE ITEM
  // ==============================
  async updateScoreItem(updateScoreItemDto: UpdateScoreItemDto) {
    const { scoreItemId, value } = updateScoreItemDto;

    // Fetch item with its config for maxScore validation
    const scoreItem = await this.prisma.scoreItem.findUnique({
      where: { id: scoreItemId },
      include: { config: true },
    });

    if (!scoreItem) {
      throw new AppException(
        'Score item not found',
        'SCORE_ITEM_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    if (value > scoreItem.config.maxScore) {
      throw new AppException(
        `Value (${value}) exceeds maxScore (${scoreItem.config.maxScore}) for "${scoreItem.config.name}"`,
        'VALUE_EXCEEDS_MAX_SCORE',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.scoreItem.update({
        where: { id: scoreItemId },
        data: { value },
      });

      // Recalculate totalScore from all items on this score
      const aggregate = await tx.scoreItem.aggregate({
        where: { scoreId: scoreItem.scoreId },
        _sum: { value: true },
      });

      const totalScore = aggregate._sum.value ?? 0;
      const subjectGrade = calculateGrade(totalScore);

      await tx.score.update({
        where: { id: scoreItem.scoreId },
        data: { totalScore, subjectGrade },
      });

      return tx.score.findUnique({
        where: { id: scoreItem.scoreId },
        include: { items: true },
      });
    });
  }
}
