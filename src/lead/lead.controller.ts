import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dtos/create-lead.dto';
import { UpdateLeadStatusDto } from './dtos/update-lead-status.dto';

@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  // POST /leads — public, กรอกจากหน้าสมัคร
  @Public()
  @Post()
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadService.create(createLeadDto);
  }

  // GET /leads?status=WAITING — admin/super_admin
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  findAll(@Query('status') status?: string) {
    return this.leadService.findAll(status);
  }

  // PATCH /leads/:id/status — อัปเดต WAITING → CONTACTED
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateLeadStatusDto: UpdateLeadStatusDto,
  ) {
    return this.leadService.updateStatus(id, updateLeadStatusDto);
  }

  // DELETE /leads/:id — soft delete
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(204)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leadService.remove(id);
  }
}
