import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
  HttpStatus,
} from '@nestjs/common';

import { ScoreService } from './score.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { Public } from 'src/auth/decorators/public.decorator';
import { AppException } from 'src/common/exceptions/app-exception';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { ScoreResponseDto } from './dtos/response/score-response.dto';
import { CreateScoreWithItemsDto } from './dtos/request/create-score-with-item.dto';
import { GPAResponseDto } from './dtos/response/gpa-response.dto';

@Controller('scores')
@UseInterceptors(ClassSerializerInterceptor)
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  // ==============================
  // CREATE / UPDATE SCORE
  // ==============================
  @Roles(Role.TEACHER)
  @SerializeOptions({
    type: ScoreResponseDto,
    excludeExtraneousValues: true,
  })
  @Post('with-items')
  upsertScoreWithItems(
    @Body() createScoreWithItemsDto: CreateScoreWithItemsDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ScoreResponseDto> {
    return this.scoreService.upsertScoreWithItems({
      ...createScoreWithItemsDto,
      teacherId: user.sub,
    });
  }

  // ==============================
  // GET SCORES
  // ==============================
  @Public()
  @SerializeOptions({
    type: ScoreResponseDto,
    excludeExtraneousValues: true,
  })
  @Get('student/:studentId')
  findByStudent(
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<ScoreResponseDto[]> {
    return this.scoreService.findByStudentId(studentId);
  }

  // ==============================
  // GET GPA
  // ==============================
  @Public()
  @Get(':studentId/gpa')
  getGPA(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('term') term: string,
    @Query('year') year: string,
  ): Promise<GPAResponseDto> {
    const parsedTerm = Number(term);
    const parsedYear = Number(year);

    if (
      isNaN(parsedTerm) ||
      isNaN(parsedYear) ||
      parsedTerm < 1 ||
      parsedTerm > 2
    ) {
      throw new AppException(
        'Invalid term or year',
        'INVALID_QUERY',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.scoreService.getGPA(studentId, parsedTerm, parsedYear);
  }
}
