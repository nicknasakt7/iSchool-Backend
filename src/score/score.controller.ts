import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { ScoreService } from './score.service';
import { CreateScoreDto } from './dtos/create-score.dto';
import { UpdateScoreDto } from './dtos/update-score.dto';
import { CreateScoreItemDto } from './dtos/create-score-item.dto';

@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  // ✅ create score
  @Roles(Role.TEACHER)
  @Post('scores')
  create(@Body() dto: CreateScoreDto) {
    return this.scoreService.create(dto);
  }

  // ✅ get scores by student
  @Roles(Role.TEACHER, Role.PARENT)
  @Get('scores/student/:id')
  findByStudent(@Param('id') id: string) {
    return this.scoreService.findByStudentId(id);
  }

  // ✅ update score
  @Roles(Role.TEACHER)
  @Patch('scores/:id')
  update(@Param('id') id: string, @Body() dto: UpdateScoreDto) {
    return this.scoreService.update(id, dto);
  }

  // ✅ create or update score item
  @Roles(Role.TEACHER)
  @Post('score-items')
  createItem(@Body() dto: CreateScoreItemDto) {
    return this.scoreService.createOrUpdateScoreItem(dto);
  }
}
