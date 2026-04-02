import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { BcryptService } from 'src/shared/security/services/bcrypt.service';
import {
  PrismaClientKnownRequestError,
  TeacherUpdateInput,
} from 'src/database/generated/prisma/internal/prismaNamespace';
import { AppException } from 'src/common/exceptions/app-exception';
import { CreateTeacherDto } from './dtos/request/create-teacher.dto';
import { UpdateTeacherDto } from './dtos/request/update-teacher.dto';
import { TeacherResponseDto } from './dtos/response/teacher-response.dto';
import { AssignSubjectDto } from './dtos/request/assign-subject.dto';
import { SubjectAssignmentResponseDto } from './dtos/response/subject-assignment-response.dto';
import { CloudinaryService } from 'src/shared/upload/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';

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

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let profileImageUrl: string | null = null;
        let profileImagePublicId: string | null = null;

        // ✅ fix ESLint โดย cast type (ไม่ต้องแก้ service เพื่อน)
        if (file) {
          const res = (await this.cloudinaryService.upload(
            file,
          )) as UploadApiResponse;

          profileImageUrl = res.secure_url;
          profileImagePublicId = res.public_id;
        }

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

        return { ...user, teacher };
      });

      return this.mapTeacherResponse(result);
    } catch (error) {
      console.error('Create teacher error:', error);

      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email already exists');
      }

      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException('Invalid homeroom class');
      }

      throw new InternalServerErrorException('Failed to create teacher');
    }
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

    // 🔥 ลบรูปเก่าก่อน (ถ้ามี)
    if (teacher.user.profileImagePublicId) {
      await this.cloudinaryService.delete(teacher.user.profileImagePublicId);
    }

    const res = (await this.cloudinaryService.upload(
      file,
    )) as UploadApiResponse;

    const updatedUser = await this.prisma.user.update({
      where: { id: teacher.userId },
      data: {
        profileImageUrl: res.secure_url,
        profileImagePublicId: res.public_id,
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

    // ลบรูปใน cloudinary ด้วย
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

      return {
        id: teacher.id,
        email: teacher.user.email,
        gender: teacher.user.gender,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        homeroomClassId: teacher.homeroomClassId,
        profileImageUrl: teacher.user.profileImageUrl,
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt,
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

      const existing = await this.prisma.subjectAssignment.findFirst({
        where: { teacherId, subjectId, classId },
      });

      if (existing) {
        throw new BadRequestException('Subject already assigned to this class');
      }

      const assignment = await this.prisma.subjectAssignment.create({
        data: { teacherId, subjectId, classId },
      });

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
  private mapTeacherResponse(user: any) {
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
