import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { BcryptService } from 'src/shared/security/services/bcrypt.service';
import { TeacherUpdateInput } from 'src/database/generated/prisma/internal/prismaNamespace';
import { AppException } from 'src/common/exceptions/app-exception';
import { CreateTeacherDto } from './dtos/request/create-teacher.dto';
import { UpdateTeacherDto } from './dtos/request/update-teacher.dto';
import { TeacherResponseDto } from './dtos/response/teacher-response.dto';
import { AssignSubjectDto } from './dtos/request/assign-subject.dto';
import { SubjectAssignmentResponseDto } from './dtos/response/subject-assignment-response.dto';
import { CloudinaryService } from 'src/shared/upload/cloudinary.service';
import { UserWithTeacher } from 'src/types/user-with-teacher';
import { GetTeachersQueryDto } from 'src/student/dtos/response/get-teacher-query.dto';
import { GetAllTeachersQueryResponseDto } from './dtos/response/get-all-query-response.dto';

@Injectable()
export class TeacherService {
  constructor(
    private prisma: PrismaService,
    private readonly bcryptService: BcryptService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ================= CREATE =================
  async create(createTeacherDto: CreateTeacherDto, file?: Express.Multer.File) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createTeacherDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await this.bcryptService.hash(
      createTeacherDto.password,
    );

    //  1. upload ก่อน (นอก transaction)
    let profileImageUrl: string | null = null;
    let profileImagePublicId: string | null = null;

    if (file) {
      const uploaded = await this.cloudinaryService.upload(file);
      profileImageUrl = uploaded.url;
      profileImagePublicId = uploaded.publicId;
    }

    try {
      //  2. ค่อยเข้า transaction
      const result: UserWithTeacher = await this.prisma.$transaction(
        async (tx) => {
          const user = await tx.user.create({
            data: {
              email: createTeacherDto.email,
              password: hashedPassword,
              gender: createTeacherDto.gender,
              role: 'TEACHER',
              profileImageUrl,
              profileImagePublicId,
            },
          });

          const teacher = await tx.teacher.create({
            data: {
              userId: user.id,
              firstName: createTeacherDto.firstName,
              lastName: createTeacherDto.lastName,
              homeroomClassId: createTeacherDto.homeroomClassId,
            },
          });

          return {
            ...user,
            teacher,
          };
        },
      );

      return this.mapTeacherResponse(result);
    } catch (error) {
      console.error('Create teacher error:', error);

      throw new InternalServerErrorException('Failed to create teacher');
    }
  }

  //===========FIND ONE============//
  async findOne(id: string): Promise<TeacherResponseDto> {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        user: true,
        subjects: {
          where: { deletedAt: null },
          include: {
            subject: true,
            classroom: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      id: teacher.id,
      email: teacher.user.email,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      gender: teacher.user.gender,
      homeroomClassId: teacher.homeroomClassId,
      profileImageUrl: teacher.user.profileImageUrl,

      subjects: teacher.subjects.map((s) => ({
        id: s.id,
        teacherId: s.teacherId,
        subjectId: s.subjectId,
        classId: s.classId,
        createdAt: s.createdAt,

        subjectName: s.subject?.name,
        className: s.classroom?.name,
      })),

      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
    };
  }

  // ================= UPLOAD PROFILE IMAGE =================
  async uploadProfileImage(teacherId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Profile image is required');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!teacher) {
      throw new BadRequestException('Teacher not found');
    }

    // ลบรูปเก่าก่อน
    if (teacher.user.profileImagePublicId) {
      await this.cloudinaryService.delete(teacher.user.profileImagePublicId);
    }

    const uploaded = await this.cloudinaryService.upload(file);

    const updatedUser = await this.prisma.user.update({
      where: { id: teacher.userId },
      data: {
        profileImageUrl: uploaded.url,
        profileImagePublicId: uploaded.publicId,
      },
    });

    return {
      teacherId: teacher.id,
      userId: updatedUser.id,
      profileImageUrl: updatedUser.profileImageUrl,
    };
  }

  // ================= DELETE =================
  async deleteTeacher(id: string): Promise<void> {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!teacher) {
      throw new AppException(
        'Teacher not found',
        'TEACHER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    // ลบรูปด้วย
    if (teacher.user.profileImagePublicId) {
      await this.cloudinaryService.delete(teacher.user.profileImagePublicId);
    }

    await this.prisma.teacher.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  //=========GET ALL TEACHER=======
  async findAll(
    query: GetTeachersQueryDto,
  ): Promise<GetAllTeachersQueryResponseDto> {
    const { search, subjectId, classId, gradeId, page = 1, limit = 10 } = query;

    const where = {
      deletedAt: null,
      AND: [
        search
          ? {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' as const } },
                { lastName: { contains: search, mode: 'insensitive' as const } },
                {
                  user: {
                    email: { contains: search, mode: 'insensitive' as const },
                  },
                },
              ],
            }
          : {},

        subjectId
          ? {
              subjects: {
                some: { subjectId, deletedAt: null },
              },
            }
          : {},

        classId
          ? {
              subjects: {
                some: { classId, deletedAt: null },
              },
            }
          : {},

        gradeId
          ? {
              subjects: {
                some: {
                  deletedAt: null,
                  classroom: { gradeId },
                },
              },
            }
          : {},
      ],
    };

    // Fetch all matching teachers for sort + manual pagination
    const allMatching = await this.prisma.teacher.findMany({
      where,
      include: {
        user: true,
        subjects: {
          where: { deletedAt: null },
          include: {
            subject: true,
            classroom: true,
          },
        },
        homeroomClass: {
          include: { grade: true },
        },
      },
    });

    // Sort by homeroom grade level ascending, teachers without homeroom last
    allMatching.sort((a, b) => {
      const aLevel = a.homeroomClass?.grade?.level ?? Infinity;
      const bLevel = b.homeroomClass?.grade?.level ?? Infinity;
      if (aLevel !== bLevel) return aLevel - bLevel;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const total = allMatching.length;
    const teachers = allMatching.slice((page - 1) * limit, page * limit);

    // map ให้ตรง DTO
    const mappedTeachers = teachers.map((teacher) => ({
      ...teacher,

      email: teacher.user.email,
      gender: teacher.user.gender,
      profileImageUrl: teacher.user.profileImageUrl,

      homeroomClass: teacher.homeroomClass
        ? {
            id: teacher.homeroomClass.id,
            name: teacher.homeroomClass.name,
            gradeId: teacher.homeroomClass.gradeId,
            gradeLevel: teacher.homeroomClass.grade.level,
            gradeName: teacher.homeroomClass.grade.name,
          }
        : null,

      subjects: teacher.subjects.map((s) => ({
        ...s,
        subjectName: s.subject?.name,
        className: s.classroom?.name,
      })),
    }));

    return {
      data: mappedTeachers,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  // ================= UPDATE =================
  async update(
    id: string,
    updateTeacherDto: UpdateTeacherDto,
  ): Promise<TeacherResponseDto> {
    try {
      const existing = await this.prisma.teacher.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppException(
          'Teacher not found',
          'TEACHER_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      if (updateTeacherDto.homeroomClassId) {
        const classroom = await this.prisma.classroom.findUnique({
          where: { id: updateTeacherDto.homeroomClassId },
        });

        if (!classroom) {
          throw new BadRequestException('Invalid homeroom class');
        }
      }

      const data: TeacherUpdateInput = {
        ...(updateTeacherDto.firstName !== undefined && {
          firstName: updateTeacherDto.firstName,
        }),
        ...(updateTeacherDto.lastName !== undefined && {
          lastName: updateTeacherDto.lastName,
        }),
        ...(updateTeacherDto.homeroomClassId !== undefined && {
          homeroomClassId: updateTeacherDto.homeroomClassId,
        }),
      };

      const teacher = await this.prisma.teacher.update({
        where: { id },
        data,
        include: { user: true },
      });

      // Update user fields if provided
      if (updateTeacherDto.email !== undefined || updateTeacherDto.gender !== undefined) {
        await this.prisma.user.update({
          where: { id: teacher.userId },
          data: {
            ...(updateTeacherDto.email !== undefined && { email: updateTeacherDto.email }),
            ...(updateTeacherDto.gender !== undefined && { gender: updateTeacherDto.gender }),
          },
        });
      }

      const updatedTeacher = await this.prisma.teacher.findUnique({
        where: { id },
        include: { user: true },
      });

      return {
        id: updatedTeacher!.id,
        email: updatedTeacher!.user.email,
        gender: updatedTeacher!.user.gender,
        firstName: updatedTeacher!.firstName,
        lastName: updatedTeacher!.lastName,
        homeroomClassId: updatedTeacher!.homeroomClassId,
        profileImageUrl: updatedTeacher!.user.profileImageUrl,
        createdAt: updatedTeacher!.createdAt,
        updatedAt: updatedTeacher!.updatedAt,
      };
    } catch (error) {
      console.error('UPDATE ERROR:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new AppException(
        'Failed to update teacher',
        'UPDATE_TEACHER_FAILED',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ================= ASSIGN SUBJECT =================
  async assignSubject(
    assignSubjectDto: AssignSubjectDto,
  ): Promise<SubjectAssignmentResponseDto> {
    const { teacherId, subjectId, classId } = assignSubjectDto;

    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
      });

      if (!teacher) {
        throw new AppException(
          'Teacher not found',
          'TEACHER_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      const subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
      });

      if (!subject) {
        throw new AppException(
          'Subject not found',
          'SUBJECT_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      const classroom = await this.prisma.classroom.findUnique({
        where: { id: classId },
      });

      if (!classroom) {
        throw new AppException(
          'Class not found',
          'CLASS_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      const existingActive = await this.prisma.subjectAssignment.findFirst({
        where: { teacherId, subjectId, classId, deletedAt: null },
      });

      if (existingActive) {
        throw new BadRequestException('Subject already assigned to this class');
      }

      // Restore soft-deleted record if exists, otherwise create new
      const softDeleted = await this.prisma.subjectAssignment.findFirst({
        where: { teacherId, subjectId, classId, deletedAt: { not: null } },
      });

      let assignment;
      if (softDeleted) {
        assignment = await this.prisma.subjectAssignment.update({
          where: { id: softDeleted.id },
          data: { deletedAt: null },
        });
      } else {
        assignment = await this.prisma.subjectAssignment.create({
          data: { teacherId, subjectId, classId },
        });
      }

      return {
        id: assignment.id,
        teacherId: assignment.teacherId,
        subjectId: assignment.subjectId,
        classId: assignment.classId,
        createdAt: assignment.createdAt,
      };
    } catch (error) {
      console.error('ASSIGN SUBJECT ERROR:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof AppException
      ) {
        throw error;
      }

      throw new AppException(
        'Failed to assign subject',
        'ASSIGN_SUBJECT_FAILED',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ================= MAPPER =================
  private mapTeacherResponse(user: UserWithTeacher) {
    if (!user.teacher) {
      throw new InternalServerErrorException('Teacher data missing');
    }

    return {
      id: user.teacher.id,
      email: user.email,
      gender: user.gender,
      firstName: user.teacher.firstName,
      lastName: user.teacher.lastName,
      homeroomClassId: user.teacher.homeroomClassId,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.teacher.createdAt,
      updatedAt: user.teacher.updatedAt,
    };
  }
}
