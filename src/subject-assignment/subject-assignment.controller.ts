import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Get,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';
import { SubjectAssignmentService } from './subject-assignment.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { ConfigResponseDto } from 'src/subject/dtos/response/config-response.dto';
import { CreateConfigDto } from 'src/subject/dtos/request/create-config.dto';
import { FindAssignmentQueryDto } from './dtos/find-assignment-query.dto';
import { SubjectAssignmentResponseDto } from './dtos/subject-assignment-response.dto';

@Controller('subject-assignments')
@UseInterceptors(ClassSerializerInterceptor)
export class SubjectAssignmentController {
  constructor(
    private readonly subjectAssignmentService: SubjectAssignmentService,
  ) {}

  //==============
  // FIND ASSIGNMENT BY CLASSROOM + SUBJECT
  //==============
  @Roles(Role.ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: SubjectAssignmentResponseDto,
    excludeExtraneousValues: true,
  })
  @Get('find')
  findByClassroomAndSubject(
    @Query() findAssignmentQueryDto: FindAssignmentQueryDto,
  ) {
    return this.subjectAssignmentService.findByClassroomAndSubject(
      findAssignmentQueryDto,
    );
  }

  //==============
  // CREATE SUBJECT CONFIG
  //==============
  @Roles(Role.ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: ConfigResponseDto,
    excludeExtraneousValues: true,
  })
  @Post(':id/config')
  createConfig(
    @Param('id', ParseUUIDPipe) assignmentId: string,
    @Body() createConfigDto: CreateConfigDto,
  ) {
    return this.subjectAssignmentService.createSubjectConfig(
      assignmentId,
      createConfigDto,
    );
  }

  //==============
  // GET SUBJECT CONFIG
  //==============
  @Roles(Role.ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: ConfigResponseDto,
    excludeExtraneousValues: true,
  })
  @Get(':id/config')
  getSubjectConfigs(@Param('id', ParseUUIDPipe) subjectId: string) {
    return this.subjectAssignmentService.getSubjectConfigs(subjectId);
  }
}
