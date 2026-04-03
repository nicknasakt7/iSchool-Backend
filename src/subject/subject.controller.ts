import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';

import { SubjectService } from './subject.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { SubjectResponseDto } from './dtos/response/subject-response.dto';
import { CreateSubjectDto } from './dtos/request/create-subject.dto';
import { CreateManySubjectDto } from './dtos/request/create-many-subject.dto';
import { SubjectWithConfigResponseDto } from './dtos/response/subject-config.dto';
import { UpdateSubjectDto } from './dtos/request/update-subject.dto';

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

  // POST /subjects/many (ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: SubjectResponseDto,
    excludeExtraneousValues: true,
  })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('many')
  createMany(@Body() createManySubjectDto: CreateManySubjectDto) {
    return this.subjectService.createMany(createManySubjectDto);
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subjectService.remove(id);
  }
}
