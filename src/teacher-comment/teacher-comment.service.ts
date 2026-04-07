import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { AppException } from 'src/common/exceptions/app-exception';
import { TeacherComment } from 'src/database/generated/prisma/client';
import { CreateOrUpdateCommentDto } from './dto/create-or-update-comment.dto';

@Injectable()
export class TeacherCommentService {
  constructor(private readonly prisma: PrismaService) {}

  // ==============================
  // GET COMMENT
  // ==============================

  // Each student can have only one comment per subject, term, and year.
  // This uses a composite unique key.
  async getComment(
    studentId: string,
    subjectId: string,
    term: number,
    year: number,
  ): Promise<TeacherComment | null> {
    return this.prisma.teacherComment.findUnique({
      where: {
        studentId_subjectId_term_year: { studentId, subjectId, term, year },
      },
    });
  }

  // ==============================
  // UPSERT COMMENT
  // ==============================

  // Each student can have only one comment per subject, term, and year.
  // This uses a composite unique key.
  async upsertComment(
    createOrUpdateCommentDto: CreateOrUpdateCommentDto,
    userId: string,
  ): Promise<TeacherComment> {
    const { studentId, subjectId, term, year, content } =
      createOrUpdateCommentDto;

    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!teacher) {
      throw new AppException(
        'Teacher profile not found for current user',
        'TEACHER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.teacherComment.upsert({
      where: {
        studentId_subjectId_term_year: { studentId, subjectId, term, year },
      },
      update: { content, teacherId: teacher.id },
      create: {
        studentId,
        subjectId,
        term,
        year,
        content,
        teacherId: teacher.id,
      },
    });
  }

  // ==============================
  // DELETE COMMENT
  // ==============================
  async deleteComment(id: string): Promise<TeacherComment> {
    const comment = await this.prisma.teacherComment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new AppException(
        'Teacher comment not found',
        'COMMENT_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.teacherComment.delete({ where: { id } });
  }
}
