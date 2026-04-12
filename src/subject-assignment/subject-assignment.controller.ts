import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  Get,
  HttpCode,
  HttpStatus,
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
import { SubjectsByClassroomResponseDto } from './dtos/subjects-by-classroom-response.dto';
import { IsUUID } from 'class-validator';

class ByClassroomQueryDto {
  @IsUUID()
  classroomId: string;
}

@Controller('subject-assignments')
@UseInterceptors(ClassSerializerInterceptor)
export class SubjectAssignmentController {
  constructor(
    private readonly subjectAssignmentService: SubjectAssignmentService,
  ) {}

  //==============
  // GET ALL SUBJECTS ASSIGNED TO A CLASSROOM
  //==============
  @Roles(Role.ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: SubjectsByClassroomResponseDto,
    excludeExtraneousValues: true,
  })
  @Get('by-classroom')
  getSubjectsByClassroom(@Query() query: ByClassroomQueryDto) {
    return this.subjectAssignmentService.getSubjectsByClassroom(query.classroomId);
  }

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

  //==============
  // DELETE SUBJECT ASSIGNMENT
  //==============
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSubjectAssignment(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.subjectAssignmentService.deleteSubjectAssignment(id);
  }
}
