import { Injectable, NotFoundException } from '@nestjs/common';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from 'src/database/prisma.service';

export class FindParentsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}

@Injectable()
export class ParentService {
  constructor(private prisma: PrismaService) {}

  // GET /parents/me
  async getMe(userId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent;
  }

  // GET /parents — admin list with search
  async findAll(query: FindParentsQueryDto) {
    const { search, page = 1, limit = 10 } = query;

    const where = {
      deletedAt: null as null,
      ...(search
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
        : {}),
    };

    const [parents, total] = await Promise.all([
      this.prisma.parent.findMany({
        where,
        include: {
          user: true,
          students: {
            where: { deletedAt: null },
            select: { id: true, firstName: true, lastName: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.parent.count({ where }),
    ]);

    return {
      data: parents.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.user.email,
        tel: p.tel,
        lineId: p.lineId,
        students: p.students,
      })),
      meta: { total, page, limit },
    };
  }

  // GET /parents/my-student
  async getMyStudent(userId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: {
        students: {
          include: {
            classroom: true,
            grade: true,
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent.students;
  }
}
