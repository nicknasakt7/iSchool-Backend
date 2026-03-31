import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateCalendarDto } from './dtos/create-calendar.dto';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async upload(createCalendarDto: CreateCalendarDto) {
    return this.prisma.calendarImage.create({
      data: {
        title: createCalendarDto.title,
        imageUrl: createCalendarDto.imageUrl,
      },
    });
  }

  async findAll() {
    return this.prisma.calendarImage.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(id: string) {
    return this.prisma.calendarImage.delete({
      where: { id },
    });
  }
}
