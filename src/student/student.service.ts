import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateStudentDto } from './dtos/request/create-student.dto';
import { UpdateStudentDto } from './dtos/request/update-student.dto';
import { customAlphabet } from 'nanoid';
import { CloudinaryService } from 'src/shared/upload/cloudinary.service';
import { GetStudentsQueryDto } from './dtos/request/get-query-student.dto';
import { GetAllStudentsQueryResponseDto } from './dtos/response/get-all-student-response.dto';
import { Prisma } from 'src/database/generated/prisma/client';

@Injectable()
export class StudentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ใช้ generate studentCode อัตโนมัติ (เช่น ST-ABC123)
  private generateStudentCode() {
    const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
    return `ST-${nanoid()}`;
  }

  // ใช้ normalize email (trim + lowercase) เพื่อให้ match ได้แม่นยำ
  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  // ========================
  // CREATE STUDENT
  // ========================
  // - สร้าง student ใหม่
  // - generate studentCode อัตโนมัติ
  // - normalize parentsEmail ก่อน save
  // - รองรับอัปโหลด profile image
  async create(createStudentDto: CreateStudentDto, file?: Express.Multer.File) {
    const studentCode = this.generateStudentCode();

    let profileImageUrl: string | null = null;
    let profileImagePublicId: string | null = null;

    if (file) {
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed');
      }

      const uploaded = await this.cloudinaryService.upload(file);
      profileImageUrl = uploaded.url;
      profileImagePublicId = uploaded.publicId;
    }

    return this.prisma.student.create({
      data: {
        ...createStudentDto,
        parentsEmail: this.normalizeEmail(createStudentDto.parentsEmail),
        studentCode,
        profileImageUrl,
        profileImagePublicId,
      },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
    });
  }

  // ========================
  // GET ALL STUDENTS
  // ========================

  async findAll(
    query: GetStudentsQueryDto,
  ): Promise<GetAllStudentsQueryResponseDto> {
    const { search, gradeId, classId, page = 1, limit = 10 } = query;

    const andConditions: Prisma.StudentWhereInput[] = [];

    if (search) {
      andConditions.push({
        OR: [
          {
            firstName: { contains: search, mode: Prisma.QueryMode.insensitive },
          },
          {
            lastName: { contains: search, mode: Prisma.QueryMode.insensitive },
          },
          {
            nickName: { contains: search, mode: Prisma.QueryMode.insensitive },
          },
          {
            studentCode: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            parentsEmail: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            parent: {
              user: {
                email: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        ],
      });
    }

    if (gradeId) {
      andConditions.push({ gradeId });
    }

    if (classId) {
      andConditions.push({ classId });
    }

    const where: Prisma.StudentWhereInput = {
      deletedAt: null,
      ...(andConditions.length > 0 && { AND: andConditions }),
    };

    const [students, filteredTotal, totalAll] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          parent: { include: { user: true } },
          classroom: true,
          grade: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),

      this.prisma.student.count({ where }),

      this.prisma.student.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      data: students,
      meta: {
        total: filteredTotal,
        totalAll,
        page,
        limit,
      },
    };
  }

  // ========================
  // GET STUDENT BY ID (DETAIL)
  // ========================
  // - ดึง student รายคนพร้อม scores และ comments ของ term/year ที่ระบุ
  // - ถ้าไม่ระบุ term/year จะใช้ค่า default (term=1, year=ปัจจุบัน)
  async findOne(id: string, term?: number, year?: number) {
    const resolvedYear = year ?? new Date().getFullYear();
    const resolvedTerm = term ?? 1;

    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
        scores: {
          where: { term: resolvedTerm, year: resolvedYear },
          include: { subject: true },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          where: { term: resolvedTerm, year: resolvedYear, deletedAt: null },
          include: {
            subject: true,
            teacher: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  // ========================
  // UPDATE STUDENT
  // ========================
  // - อัปเดตข้อมูล student
  // - ถ้ามี parentsEmail → normalize ก่อน save
  async update(id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findFirst({
      where: { id, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.parentsEmail && {
          parentsEmail: this.normalizeEmail(dto.parentsEmail),
        }),
      },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
    });
  }

  // ========================
  // UPLOAD PROFILE IMAGE
  // ========================
  // - อัปโหลดรูปขึ้น Cloudinary
  // - ถ้ามีรูปเก่า ให้ลบรูปเก่าก่อน
  // - บันทึก profileImageUrl / profileImagePublicId ลง DB
  async uploadProfileImage(studentId: string, file: Express.Multer.File) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!file) {
      throw new BadRequestException('Profile image is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    if (student.profileImagePublicId) {
      await this.cloudinaryService.delete(student.profileImagePublicId);
    }

    const uploaded = await this.cloudinaryService.upload(file);

    return this.prisma.student.update({
      where: { id: studentId },
      data: {
        profileImageUrl: uploaded.url,
        profileImagePublicId: uploaded.publicId,
      },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
    });
  }

  // ========================
  // SOFT DELETE STUDENT
  // ========================
  // - ลบนักเรียนแบบ soft delete (set deletedAt)
  // - ห้ามลบถ้ายังมี parent ผูกอยู่
  async remove(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { parent: true },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.deletedAt) {
      throw new BadRequestException('Student already deleted');
    }

    if (student.parentId) {
      throw new BadRequestException(
        'Cannot delete student while parent is still assigned',
      );
    }

    // ลบรูป profile image จาก Cloudinary ถ้ามี
    if (student.profileImagePublicId) {
      await this.cloudinaryService.delete(student.profileImagePublicId);
    }

    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
    });
  }

  // ========================
  // FILTER BY GRADE
  // ========================
  async findByGrade(gradeId: string) {
    return this.prisma.student.findMany({
      where: { deletedAt: null, gradeId },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ========================
  // FILTER BY CLASSROOM
  // ========================
  async findByClassroom(classroomId: string) {
    return this.prisma.student.findMany({
      where: { deletedAt: null, classId: classroomId },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ========================
  // SEARCH STUDENT
  // ========================
  // - search จาก name / studentCode / parentsEmail
  async searchStudent(query: string) {
    if (!query?.trim()) {
      throw new BadRequestException('query is required');
    }

    return this.prisma.student.findMany({
      where: {
        deletedAt: null,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { studentCode: { contains: query, mode: 'insensitive' } },
          { parentsEmail: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
    });
  }

  // ========================
  // FIND PARENT MATCH (AUTO MATCH)
  // ========================
  // - ใช้ parentsEmail ของ student ไปหา parent.user.email
  // - ใช้ในปุ่ม "Find Parents"
  async findParentMatch(studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.parentsEmail?.trim()) {
      throw new BadRequestException('Student has no parent email');
    }

    const normalizedEmail = this.normalizeEmail(student.parentsEmail);

    const candidate = await this.prisma.parent.findFirst({
      where: {
        deletedAt: null,
        user: {
          email: {
            equals: normalizedEmail,
            mode: 'insensitive',
          },
        },
      },
      include: { user: true },
    });

    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      parentsEmail: student.parentsEmail,
      alreadyMatched: !!student.parentId,
      currentParent: student.parent
        ? {
            id: student.parent.id,
            firstName: student.parent.firstName,
            lastName: student.parent.lastName,
            email: student.parent.user?.email ?? null,
          }
        : null,
      matchFound: !!candidate,
      candidate: candidate
        ? {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.user?.email ?? null,
            tel: candidate.tel,
            lineId: candidate.lineId,
          }
        : null,
    };
  }

  // ========================
  // CONFIRM MATCH (AUTO FLOW)
  // ========================
  // - ใช้ตอนกด "Match this relation"
  // - ตรวจสอบว่า email student ตรงกับ parent
  async confirmParentMatch(studentId: string, parentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.parentsEmail?.trim()) {
      throw new BadRequestException('Student has no parent email');
    }

    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, deletedAt: null },
      include: { user: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    const studentEmail = this.normalizeEmail(student.parentsEmail);
    const parentEmail = this.normalizeEmail(parent.user.email);

    if (studentEmail !== parentEmail) {
      throw new BadRequestException(
        'Selected parent email does not match student parent email',
      );
    }

    return this.prisma.student.update({
      where: { id: studentId },
      data: { parentId: parent.id },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
    });
  }

  // ========================
  // MANUAL ASSIGN (OVERRIDE)
  // ========================
  // - ใช้เมื่อ auto match ไม่เจอ
  // - admin เลือก parent เอง
  async assignParent(studentId: string, parentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, deletedAt: null },
      include: { user: true },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return this.prisma.student.update({
      where: { id: studentId },
      data: { parentId },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
    });
  }

  // ========================
  // REMOVE PARENT RELATION
  // ========================
  // - ลบความสัมพันธ์ parent ออกจาก student
  async removeParent(studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.parentId) {
      throw new BadRequestException('Student has no parent assigned');
    }

    return this.prisma.student.update({
      where: { id: studentId },
      data: { parentId: null },
      include: {
        parent: { include: { user: true } },
        classroom: true,
        grade: true,
      },
    });
  }
}
