import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateNoticeDto } from './dtos/create-notice.dto';
import { NoticeService } from './notice.service';
import { UpdateNoticeDto } from './dtos/update-notice.dto';
import { Role } from 'src/database/generated/prisma/enums';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('notice')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  // ADMIN
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createNoticeDto: CreateNoticeDto) {
    return this.noticeService.create(createNoticeDto);
  }

  // ALL
  @Get()
  @Public()
  findAll() {
    return this.noticeService.findAll();
  }

  // ADMIN
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateNoticeDto: UpdateNoticeDto) {
    return this.noticeService.update(id, updateNoticeDto);
  }

  // ADMIN
  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.noticeService.remove(id);
  }
}
