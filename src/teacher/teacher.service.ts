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
import { UserWithTeacher } from 'src/types/user-with-teacher';
import { UpdateTeacherDto } from './dtos/request/update-teacher.dto';
import { TeacherResponseDto } from './dtos/response/teacher-response.dto';
import { AssignSubjectDto } from './dtos/request/assign-subject.dto';
import { SubjectAssignmentResponseDto } from './dtos/response/subject-assignment-response.dto';

@Injectable()
export class TeacherService {
  constructor(
    private prisma: PrismaService,
    private readonly bcryptService: BcryptService,
  ) {}

  // create(createTeacherDto: CreateTeacherDto) {
  //   return this.prisma.teacher.create({
  //     data: createTeacherDto,
  //   });
  // }

  // CREATE TEACHER
  async create(createTeacherDto: CreateTeacherDto) {
    // check email ซ้ำ
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createTeacherDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // hash password
    const hashedPassword = await this.bcryptService.hash(
      createTeacherDto.password,
    );

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. create user
        const user = await tx.user.create({
          data: {
            email: createTeacherDto.email,
            password: hashedPassword,
            gender: createTeacherDto.gender,
            role: 'TEACHER',
          },
        });
        console.log('created user:', user);

        // 2. create teacher (ผูกด้วย userId แบบชัด ๆ)
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

      // email ซ้ำ (กัน race condition)
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email already exists');
      }

      // foreign key (class ไม่มี)
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException('Invalid homeroom class');
      }

      throw new InternalServerErrorException('Failed to create teacher');
    }
  }

  //  MAPPER
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

  //DELETE
  async deleteTeacher(id: string): Promise<void> {
    const teacher = await this.prisma.teacher.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!teacher) {
      throw new AppException(
        'Teacher not found',
        'TEACHER_NOT_FOUND',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.teacher.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async update(
    id: string,
    updateTeacherDto: UpdateTeacherDto,
  ): Promise<TeacherResponseDto> {
    console.log('UPDATE TEACHER:', id, updateTeacherDto);

    try {
      // 1. check teacher
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

      // 2. validate classroom
      if (updateTeacherDto.homeroomClassId) {
        const classroom = await this.prisma.classroom.findUnique({
          where: { id: updateTeacherDto.homeroomClassId },
        });

        if (!classroom) {
          throw new BadRequestException('Invalid homeroom class');
        }
      }

      // 3. build data
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

      // 4. update
      const teacher = await this.prisma.teacher.update({
        where: { id },
        data,
        include: { user: true },
      });

      // 5. response
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

  async assignSubject(
    assignSubjectDto: AssignSubjectDto,
  ): Promise<SubjectAssignmentResponseDto> {
    const { teacherId, subjectId, classId } = assignSubjectDto;

    try {
      // 1. check teacher
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

      // 2. check subject
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

      // 3. check class
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

      // 4. check duplicate
      const existing = await this.prisma.subjectAssignment.findFirst({
        where: {
          teacherId,
          subjectId,
          classId,
        },
      });

      if (existing) {
        throw new BadRequestException('Subject already assigned to this class');
      }

      // 5. create
      const assignment = await this.prisma.subjectAssignment.create({
        data: {
          teacherId,
          subjectId,
          classId,
        },
      });

      // 6. return response
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
}
