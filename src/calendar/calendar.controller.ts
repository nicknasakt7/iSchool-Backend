import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateCalendarDto } from './dtos/create-calendar.dto';
import { CalendarService } from './calendar.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // POST /calendar/upload (ADMIN)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('upload')
  upload(@Body() createCalendarDto: CreateCalendarDto) {
    return this.calendarService.upload(createCalendarDto);
  }

  // GET /calendar (ALL)
  @Public()
  @Get()
  findAll() {
    return this.calendarService.findAll();
  }

  // DELETE /calendar/:id (ADMIN)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarService.remove(id);
  }
}
