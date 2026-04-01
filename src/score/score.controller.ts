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
  Req,
} from '@nestjs/common';
import { ScoreService } from './score.service';

import { ScoreResponseDto } from './dtos/score-response.dto';
import { GPAResponseDto } from './dtos/gpa-response.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { Public } from 'src/auth/decorators/public.decorator';
import { AppException } from 'src/common/exceptions/app-exception';
import { CreateScoreWithItemsDto } from './dtos/create-score-with-item.dto';
import { RequestWithUser } from 'src/auth/types/request-with-user';

@Controller('scores')
@UseInterceptors(ClassSerializerInterceptor)
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  // ==============================
  // CREATE / UPDATE SCORE (MAIN)
  // ==============================
  @Roles(Role.TEACHER)
  @SerializeOptions({
    type: ScoreResponseDto,
    excludeExtraneousValues: true,
  })
  @Post('with-items')
  upsertScoreWithItems(
    @Body() dto: CreateScoreWithItemsDto,
    @Req() req: RequestWithUser,
  ): Promise<ScoreResponseDto> {
    return this.scoreService.upsertScoreWithItems({
      ...dto,
      teacherId: req.user.id, // ✅ type-safe แล้ว
    });
  }
  // ==============================
  // GET SCORES BY STUDENT
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

    if (isNaN(parsedTerm) || isNaN(parsedYear)) {
      throw new AppException(
        'Invalid term or year',
        'INVALID_QUERY',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.scoreService.getGPA(studentId, parsedTerm, parsedYear);
  }
}
