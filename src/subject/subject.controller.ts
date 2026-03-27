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
import { Role } from 'src/database/generated/prisma/enums';
import { CreateConfigDto } from './dtos/create-config.dto';
import { CreateSubjectDto } from './dtos/create-subject.dto';
import { UpdateSubjectDto } from './dtos/update-subject.dto';
import { SubjectService } from './subject.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  // POST /subjects (ADMIN)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateSubjectDto) {
    return this.subjectService.create(dto);
  }

  // GET /subjects (ALL)
  @Public()
  @Get()
  findAll() {
    return this.subjectService.findAll();
  }

  // PATCH /subjects/:id (ADMIN)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.subjectService.update(id, dto);
  }

  // DELETE /subjects/:id (ADMIN)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectService.remove(id);
  }

  // POST /subjects/:id/config (ADMIN)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post(':id/config')
  createConfig(@Param('id') subjectId: string, @Body() dto: CreateConfigDto) {
    return this.subjectService.createConfig(subjectId, dto);
  }

  // GET /subjects/:id/config (TEACHER/ADMIN)
  @Roles(Role.ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @Get(':id/config')
  getConfigs(@Param('id') subjectId: string) {
    return this.subjectService.getConfigs(subjectId);
  }
}
