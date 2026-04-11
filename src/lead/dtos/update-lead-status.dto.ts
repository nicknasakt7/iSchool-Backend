import { IsEnum } from 'class-validator';
import { LeadStatus } from 'src/database/generated/prisma/enums';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;
}
