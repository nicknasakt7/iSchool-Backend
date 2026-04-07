import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { AiInsightService } from './ai-insight.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { ClassInsightQueryDto } from './dto/class-insight-query.dto';
import { AIClassAnalysisResponseDto } from './dto/response/ai-class-analysis-response.dto';

@Controller('ai-insight')
export class AiInsightController {
  constructor(private readonly aiInsightService: AiInsightService) {}

  // ==============================
  // POST — Generate (or return cached) insight
  // ==============================
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: AIClassAnalysisResponseDto,
    excludeExtraneousValues: true,
  })
  @Post('class/:classroomId')
  generateClassInsight(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @Query() classInsightQueryDto: ClassInsightQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AIClassAnalysisResponseDto> {
    const { term, year } = classInsightQueryDto;
    return this.aiInsightService.generateClassInsight(
      classroomId,
      term,
      year,
      user.sub,
    );
  }

  // ==============================
  // GET — Fetch existing insight (returns null if not yet generated)
  // ==============================
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({
    type: AIClassAnalysisResponseDto,
    excludeExtraneousValues: true,
  })
  @Get('class/:classroomId')
  getClassInsight(
    @Param('classroomId', ParseUUIDPipe) classroomId: string,
    @Query() classInsightQueryDto: ClassInsightQueryDto,
  ): Promise<AIClassAnalysisResponseDto | null> {
    const { term, year } = classInsightQueryDto;
    return this.aiInsightService.getClassInsight(classroomId, term, year);
  }
}
