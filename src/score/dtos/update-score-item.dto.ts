import { PartialType } from '@nestjs/swagger';
import { CreateScoreItemDto } from './create-score-item.dto';

export class UpdateScoreItemDto extends PartialType(CreateScoreItemDto) {}
