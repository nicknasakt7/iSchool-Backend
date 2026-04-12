import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
  Headers,
} from '@nestjs/common';
import { BillService } from './bill.service';
import { CreateBillDto } from './dtos/request/create-bill.dto';
import { UpdateBillConfigDto } from './dtos/request/update-bill-config.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { Request } from 'express';

@Controller()
export class BillController {
  constructor(private readonly billService: BillService) {}

  // ─── Config ──────────────────────────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('bill-config')
  getConfig() {
    return this.billService.getOrCreateConfig();
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Patch('bill-config')
  updateConfig(@Body() updateBillConfigDto: UpdateBillConfigDto) {
    return this.billService.updateConfig(updateBillConfigDto);
  }

  // ─── Bills ────────────────────────────────────────────────────────────────────

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('bills')
  createBills(@Body() createBillDto: CreateBillDto) {
    return this.billService.createBills(createBillDto);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('bills')
  findAll(
    @Query('term') term?: string,
    @Query('year') year?: string,
    @Query('isPaid') isPaid?: string,
    @Query('gradeId') gradeId?: string,
    @Query('classroomId') classroomId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.billService.findAll({
      term: term ? parseInt(term) : undefined,
      year: year ? parseInt(year) : undefined,
      isPaid: isPaid !== undefined ? isPaid === 'true' : undefined,
      gradeId,
      classroomId,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Roles(Role.PARENTS)
  @Get('bills/my')
  findMyBills(@CurrentUser('sub') userId: string) {
    return this.billService.findMyBillsByUserId(userId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.PARENTS)
  @Get('bills/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.billService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete('bills/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.billService.softDelete(id);
  }

  // ─── Payment Intent ───────────────────────────────────────────────────────────

  @Roles(Role.PARENTS)
  @Post('bills/:id/payment-intent')
  createPaymentIntent(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.billService.createPaymentIntentByUserId(id, userId);
  }

  // ─── Stripe Webhook ───────────────────────────────────────────────────────────

  @Public()
  @Post('stripe/webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.billService.handleStripeWebhook(req.body as Buffer, signature);
  }
}
