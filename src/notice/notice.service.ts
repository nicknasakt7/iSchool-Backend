import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateNoticeDto } from './dtos/create-notice.dto';
import { UpdateNoticeDto } from './dtos/update-notice.dto';

@Injectable()
export class NoticeService {
  constructor(private prisma: PrismaService) {}

  async create(createNoticeDto: CreateNoticeDto) {
    return this.prisma.notice.create({
      data: {
        title: createNoticeDto.title,
        content: createNoticeDto.content,
        date: createNoticeDto.date,
      },
    });
  }

  async findAll() {
    return this.prisma.notice.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, updateNoticeDto: UpdateNoticeDto) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    return this.prisma.notice.update({
      where: { id },
      data: {
        title: updateNoticeDto.title,
        content: updateNoticeDto.content,
        date: updateNoticeDto.date,
      },
    });
  }

  async remove(id: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    // soft delete
    return this.prisma.notice.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
