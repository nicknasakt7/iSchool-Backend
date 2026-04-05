import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { TeacherCommentService } from './teacher-comment.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { GetCommentQueryDto } from './dto/get-comment-query.dto';
import { CreateOrUpdateCommentDto } from './dto/create-or-update-comment.dto';
import { TeacherCommentResponseDto } from './dto/teacher-comment-response.dto';

@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class TeacherCommentController {
  constructor(private readonly teacherCommentService: TeacherCommentService) {}

  // ==============================
  // GET COMMENT
  // ==============================
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: TeacherCommentResponseDto,
    excludeExtraneousValues: true,
  })
  @Get('teacher-comments')
  getComment(
    @Query() getCommentQueryDto: GetCommentQueryDto,
  ): Promise<TeacherCommentResponseDto | null> {
    const { studentId, subjectId, term, year } = getCommentQueryDto;
    return this.teacherCommentService.getComment(
      studentId,
      subjectId,
      term,
      year,
    ) as Promise<TeacherCommentResponseDto | null>;
  }

  // ==============================
  // UPSERT COMMENT
  // ==============================
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: TeacherCommentResponseDto,
    excludeExtraneousValues: true,
  })
  @Post('teacher-comments')
  upsertComment(
    @Body() createOrUpdateCommentDto: CreateOrUpdateCommentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<TeacherCommentResponseDto> {
    return this.teacherCommentService.upsertComment(
      createOrUpdateCommentDto,
      user.sub,
    ) as Promise<TeacherCommentResponseDto>;
  }

  // ==============================
  // DELETE COMMENT
  // ==============================
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: TeacherCommentResponseDto,
    excludeExtraneousValues: true,
  })
  @Delete('teacher-comments/:id')
  deleteComment(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TeacherCommentResponseDto> {
    return this.teacherCommentService.deleteComment(
      id,
    ) as Promise<TeacherCommentResponseDto>;
  }
}
