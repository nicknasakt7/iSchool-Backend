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
  // UPSERT CONFIG (PRESERVE MODE)
  // Items with an `id` are updated, items without are created,
  // existing configs absent from the payload are deleted (with score cleanup).
  // ==============================
  async upsertConfig(upsertConfigDto: UpsertConfigDto) {
    const { subjectAssignmentId, term, year, items } = upsertConfigDto;

    // Validate total maxScore of the final desired state <= 100
    const totalMaxScore = items.reduce((sum, item) => sum + item.maxScore, 0);
    if (totalMaxScore > 100) {
      throw new AppException(
        `Total maxScore (${totalMaxScore}) exceeds 100`,
        'MAX_SCORE_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }

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

      const existingIds = new Set(existingConfigs.map((c) => c.id));

      // Partition incoming items
      const toUpdate = items.filter(
        (item): item is typeof item & { id: string } => {
          const id: unknown = item.id;
          return typeof id === 'string' && existingIds.has(id);
        },
      );
      const toCreate = items.filter((item) => item.id === undefined);
      const incomingIds = new Set<string>(
        items
          .map((item): unknown => item.id)
          .filter((id): id is string => typeof id === 'string'),
      );
      const toDeleteIds = [...existingIds].filter((id) => !incomingIds.has(id));

      // ── DELETE removed configs + their scoreItems ──
      if (toDeleteIds.length > 0) {
        const affectedItems = await tx.scoreItem.findMany({
          where: { configId: { in: toDeleteIds } },
          select: { scoreId: true },
        });
        const affectedScoreIds = [
          ...new Set(affectedItems.map((si) => si.scoreId)),
        ];

        await tx.scoreItem.deleteMany({
          where: { configId: { in: toDeleteIds } },
        });

        // Recalculate scores that lost items
        for (const scoreId of affectedScoreIds) {
          const aggregate = await tx.scoreItem.aggregate({
            where: { scoreId },
            _sum: { value: true },
          });
          const totalScore = aggregate._sum.value ?? 0;
          await tx.score.update({
            where: { id: scoreId },
            data: { totalScore, subjectGrade: calculateGrade(totalScore) },
          });
        }

        await tx.assessmentConfig.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
      }

      // ── UPDATE existing configs ──
      for (const item of toUpdate) {
        await tx.assessmentConfig.update({
          where: { id: item.id },
          data: { name: item.name, maxScore: item.maxScore, order: item.order },
        });
      }

      // ── CREATE new configs ──
      if (toCreate.length > 0) {
        await tx.assessmentConfig.createMany({
          data: toCreate.map((item) => ({
            subjectAssignmentId,
            subjectId: assignment.subjectId,
            term,
            year,
            name: item.name,
            maxScore: item.maxScore,
            order: item.order,
          })),
        });
      }

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
    const { subjectAssignmentId, classroomId, subjectId, term, year } =
      applyConfigDto;

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
  // DELETE CONFIG
  // ==============================

  // WARNING:
  // Deleting this config will also delete all related student score items.
  // This is a destructive operation and must be confirmed by the user on the frontend.
  // Backend assumes confirmation is already handled.
  //
  // Frontend must:
  // - Show confirmation dialog before calling delete API
  // - Warn user that student scores will be permanently deleted
  async deleteConfig(configId: string) {
    const config = await this.prisma.assessmentConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      throw new AppException(
        'Assessment config not found',
        'CONFIG_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Collect affected score IDs before deletion
      const affectedItems = await tx.scoreItem.findMany({
        where: { configId },
        select: { scoreId: true },
      });
      const affectedScoreIds = [
        ...new Set(affectedItems.map((si) => si.scoreId)),
      ];

      // Step 1: Delete all scoreItems linked to this config
      await tx.scoreItem.deleteMany({ where: { configId } });

      // Step 2: Recalculate totalScore and subjectGrade for each affected score
      for (const scoreId of affectedScoreIds) {
        const aggregate = await tx.scoreItem.aggregate({
          where: { scoreId },
          _sum: { value: true },
        });

        const totalScore = aggregate._sum.value ?? 0;
        const subjectGrade = calculateGrade(totalScore);

        await tx.score.update({
          where: { id: scoreId },
          data: { totalScore, subjectGrade },
        });
      }

      // Step 3: Delete the config itself
      await tx.assessmentConfig.delete({ where: { id: configId } });

      return {
        deletedConfigId: configId,
        affectedStudentsCount: affectedScoreIds.length,
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

  // ==============================
  // GET FULL ASSESSMENT (configs + students + scores in one request)
  // ==============================
  async getFullAssessment(query: GetConfigQueryDto) {
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

    const [configs, students] = await Promise.all([
      this.prisma.assessmentConfig.findMany({
        where: { subjectAssignmentId: assignment.id, term, year },
        orderBy: { order: 'asc' },
      }),
      this.prisma.student.findMany({
        where: { classId: classroomId, deletedAt: null },
        orderBy: { studentCode: 'asc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nickName: true,
          studentCode: true,
          profileImageUrl: true,
          scores: {
            where: { subjectId, term, year },
            select: {
              id: true,
              totalScore: true,
              subjectGrade: true,
              items: {
                select: {
                  id: true,
                  configId: true,
                  value: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      configs,
      students: students.map((student) => {
        const score = student.scores[0] ?? null;
        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          nickName: student.nickName,
          studentCode: student.studentCode,
          profileImageUrl: student.profileImageUrl,
          scoreId: score?.id ?? null,
          totalScore: score?.totalScore ?? 0,
          subjectGrade: score?.subjectGrade ?? 0,
          scores: (score?.items ?? []).map((item) => ({
            scoreItemId: item.id,
            configId: item.configId,
            value: item.value,
          })),
        };
      }),
    };
  }
}
