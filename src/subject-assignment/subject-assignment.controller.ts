import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';
import { SubjectAssignmentService } from './subject-assignment.service';
import { CreateConfigDto } from '../subject/dtos/create-config.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { ConfigResponseDto } from '../subject/dtos/config-response.dto';

@Controller('subject-assignments')
@UseInterceptors(ClassSerializerInterceptor)
export class SubjectAssignmentController {
  constructor(
    private readonly subjectAssignmentService: SubjectAssignmentService,
  ) {}

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
    return this.subjectAssignmentService.createConfig(
      assignmentId,
      createConfigDto,
    );
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: ConfigResponseDto,
    excludeExtraneousValues: true,
  })
  @Get(':id/config')
  getConfigs(@Param('id', ParseUUIDPipe) assignmentId: string) {
    return this.subjectAssignmentService.getConfigs(assignmentId);
  }
}
