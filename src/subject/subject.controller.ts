import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { CreateConfigDto } from './dtos/create-config.dto';
import { CreateSubjectDto } from './dtos/create-subject.dto';
import { UpdateSubjectDto } from './dtos/update-subject.dto';
import { SubjectService } from './subject.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { SubjectResponseDto } from './dtos/subject-response.dto';
import { SubjectWithConfigResponseDto } from './dtos/subject-config.dto';
import { ConfigResponseDto } from './dtos/config-response.dto';

@Controller('subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  // POST /subjects (ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: SubjectResponseDto,
    excludeExtraneousValues: true,
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post()
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectService.create(createSubjectDto);
  }

  // GET /subjects (ALL)
  @Public()
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: SubjectWithConfigResponseDto,
    excludeExtraneousValues: true,
  })
  @Get()
  findAll() {
    return this.subjectService.findAll();
  }

  // PATCH /subjects/:id (ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: SubjectWithConfigResponseDto,
    excludeExtraneousValues: true,
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectService.update(id, updateSubjectDto);
  }

  // DELETE /subjects/:id (ADMIN)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subjectService.remove(id);
  }

  // POST /subjects/:id/config (ADMIN)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: SubjectWithConfigResponseDto,
    excludeExtraneousValues: true,
  })
  @Post(':id/config')
  createConfig(
    @Param('id', ParseUUIDPipe) subjectId: string,
    @Body() createConfigDto: CreateConfigDto,
  ) {
    return this.subjectService.createConfig(subjectId, createConfigDto);
  }

  // GET /subjects/:id/config (TEACHER/ADMIN)
  @Roles(Role.ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: ConfigResponseDto,
    excludeExtraneousValues: true,
  })
  @Get(':id/config')
  getConfigs(@Param('id', ParseUUIDPipe) subjectId: string) {
    return this.subjectService.getConfigs(subjectId);
  }
}
