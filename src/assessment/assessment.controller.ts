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
  Query,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { GetConfigQueryDto } from './dto/request/get-config-query.dto';
import { UpsertConfigDto } from './dto/request/upsert-config.dto';
import { ApplyConfigDto } from './dto/request/apply-config.dto';
import { UpdateScoreItemDto } from './dto/request/update-score-item.dto';
import { AssessmentConfigResponseDto } from './dto/response/assessment-config-response.dto';
import { ApplyResultResponseDto } from './dto/response/apply-result-response.dto';
import { ScoreWithItemsResponseDto } from './dto/response/score-with-items-response.dto';
import { DeleteConfigResponseDto } from './dto/response/delete-config-response.dto';

@Controller('assessment-config')
@UseInterceptors(ClassSerializerInterceptor)
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  // ==============================
  // GET CONFIG
  // ==============================
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: AssessmentConfigResponseDto,
    excludeExtraneousValues: true,
  })
  @Get()
  getConfig(@Query() query: GetConfigQueryDto) {
    return this.assessmentService.getConfig(query);
  }

  // ==============================
  // UPSERT CONFIG
  // ==============================
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: AssessmentConfigResponseDto,
    excludeExtraneousValues: true,
  })
  @Post('create')
  upsertConfig(@Body() upsertConfigDto: UpsertConfigDto) {
    return this.assessmentService.upsertConfig(upsertConfigDto);
  }

  // ==============================
  // APPLY CONFIG TO STUDENTS
  // ==============================
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: ApplyResultResponseDto,
    excludeExtraneousValues: true,
  })
  @Post('/apply')
  applyConfig(@Body() applyConfigDto: ApplyConfigDto) {
    return this.assessmentService.applyConfig(applyConfigDto);
  }

  // ==============================
  // DELETE CONFIG
  // ==============================
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: DeleteConfigResponseDto,
    excludeExtraneousValues: true,
  })
  @Delete('/:configId')
  deleteConfig(@Param('configId', ParseUUIDPipe) configId: string) {
    return this.assessmentService.deleteConfig(configId);
  }

  // ==============================
  // UPDATE SCORE ITEM
  // ==============================
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  @SerializeOptions({
    type: ScoreWithItemsResponseDto,
    excludeExtraneousValues: true,
  })
  @Patch('score-item')
  updateScoreItem(@Body() updateScoreItemDto: UpdateScoreItemDto) {
    return this.assessmentService.updateScoreItem(updateScoreItemDto);
  }
}
