import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { StripeService } from 'src/shared/stripe/stripe.service';
import { CreateBillDto } from './dtos/request/create-bill.dto';
import { UpdateBillConfigDto } from './dtos/request/update-bill-config.dto';
import { BillResponseDto } from './dtos/response/bill-response.dto';
import { BillConfigResponseDto } from './dtos/response/bill-config-response.dto';

@Injectable()
export class BillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
  ) {}

  // ─── Config ──────────────────────────────────────────────────────────────────

  async getOrCreateConfig(): Promise<BillConfigResponseDto> {
    let config = await this.prisma.billConfig.findFirst();
    if (!config) {
      config = await this.prisma.billConfig.create({ data: {} });
    }
    return {
      id: config.id,
      prefix: config.prefix,
      currentSequence: config.currentSequence,
      nextBillNumber: this.formatBillNumber(
        config.prefix,
        config.currentSequence + 1,
      ),
    };
  }

  async updateConfig(
    updateBillConfigDto: UpdateBillConfigDto,
  ): Promise<BillConfigResponseDto> {
    let config = await this.prisma.billConfig.findFirst();
    if (!config) {
      config = await this.prisma.billConfig.create({
        data: { prefix: updateBillConfigDto.prefix },
      });
    } else {
      config = await this.prisma.billConfig.update({
        where: { id: config.id },
        data: { prefix: updateBillConfigDto.prefix },
      });
    }
    return {
      id: config.id,
      prefix: config.prefix,
      currentSequence: config.currentSequence,
      nextBillNumber: this.formatBillNumber(
        config.prefix,
        config.currentSequence + 1,
      ),
    };
  }

  // ─── Create Bills ─────────────────────────────────────────────────────────────

  async createBills(createBillDto: CreateBillDto): Promise<BillResponseDto[]> {
    const { studentIds = [], classroomIds = [], gradeIds = [] } = createBillDto;

    if (
      studentIds.length === 0 &&
      classroomIds.length === 0 &&
      gradeIds.length === 0
    ) {
      throw new BadRequestException(
        'At least one of studentIds, classroomIds, or gradeIds must be provided',
      );
    }

    // Resolve all target student IDs
    const resolvedIds = new Set<string>(studentIds);

    if (classroomIds.length > 0) {
      const students = await this.prisma.student.findMany({
        where: { classId: { in: classroomIds }, deletedAt: null, parentId: { not: null } },
        select: { id: true },
      });
      students.forEach((s) => resolvedIds.add(s.id));
    }

    if (gradeIds.length > 0) {
      const students = await this.prisma.student.findMany({
        where: { gradeId: { in: gradeIds }, deletedAt: null, parentId: { not: null } },
        select: { id: true },
      });
      students.forEach((s) => resolvedIds.add(s.id));
    }

    if (resolvedIds.size === 0) {
      throw new BadRequestException(
        'No eligible students found (students must be linked to a parent)',
      );
    }

    // Fetch students with parent info
    const students = await this.prisma.student.findMany({
      where: { id: { in: Array.from(resolvedIds) }, deletedAt: null },
      include: { parent: true },
    });

    const eligible = students.filter((s) => s.parentId && s.parent);
    if (eligible.length === 0) {
      throw new BadRequestException(
        'No students with linked parents found',
      );
    }

    // Get or create config
    let config = await this.prisma.billConfig.findFirst();
    if (!config) {
      config = await this.prisma.billConfig.create({ data: {} });
    }

    // Create bills in a transaction — increment sequence per bill
    const createdBills = await this.prisma.$transaction(async (tx) => {
      const bills: any[] = [];

      for (const student of eligible) {
        const updated = await tx.billConfig.update({
          where: { id: config!.id },
          data: { currentSequence: { increment: 1 } },
        });

        const billNumber = this.formatBillNumber(
          updated.prefix,
          updated.currentSequence,
        );

        const bill = await tx.bill.create({
          data: {
            billNumber,
            title: createBillDto.title,
            description: createBillDto.description,
            amount: createBillDto.amount,
            term: createBillDto.term,
            year: createBillDto.year,
            dueDate: createBillDto.dueDate
              ? new Date(createBillDto.dueDate)
              : null,
            studentId: student.id,
            parentId: student.parentId!,
          },
          include: {
            student: true,
            parent: true,
          },
        });

        bills.push(bill);
      }

      return bills;
    });

    return createdBills.map((b) => this.mapBillResponse(b));
  }

  // ─── Find All (admin) ─────────────────────────────────────────────────────────

  async findAll(query: {
    term?: number;
    year?: number;
    isPaid?: boolean;
    gradeId?: string;
    classroomId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: BillResponseDto[]; meta: { total: number; page: number; limit: number } }> {
    const { term, year, isPaid, gradeId, classroomId, page = 1, limit = 20 } = query;

    const where: any = { deletedAt: null };
    if (term !== undefined) where.term = term;
    if (year !== undefined) where.year = year;
    if (isPaid !== undefined) where.isPaid = isPaid;
    if (gradeId) where.student = { gradeId };
    if (classroomId) where.student = { classId: classroomId };

    const [total, bills] = await Promise.all([
      this.prisma.bill.count({ where }),
      this.prisma.bill.findMany({
        where,
        include: { student: true, parent: true },
        orderBy: [{ isPaid: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: bills.map((b) => this.mapBillResponse(b)),
      meta: { total, page, limit },
    };
  }

  // ─── Find My Bills (parent by userId) ────────────────────────────────────────

  async findMyBillsByUserId(userId: string): Promise<BillResponseDto[]> {
    const parent = await this.prisma.parent.findUnique({ where: { userId } });
    if (!parent) throw new NotFoundException('Parent profile not found');
    return this.findMyBills(parent.id);
  }

  async findMyBills(parentId: string): Promise<BillResponseDto[]> {
    const bills = await this.prisma.bill.findMany({
      where: { parentId, deletedAt: null },
      include: { student: true, parent: true },
      orderBy: [{ isPaid: 'asc' }, { createdAt: 'desc' }],
    });
    return bills.map((b) => this.mapBillResponse(b));
  }

  // ─── Find One ─────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<BillResponseDto> {
    const bill = await this.prisma.bill.findFirst({
      where: { id, deletedAt: null },
      include: { student: true, parent: true },
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return this.mapBillResponse(bill);
  }

  // ─── Soft Delete ──────────────────────────────────────────────────────────────

  async softDelete(id: string): Promise<void> {
    const bill = await this.prisma.bill.findFirst({ where: { id, deletedAt: null } });
    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.isPaid) throw new BadRequestException('Cannot delete a paid bill');
    await this.prisma.bill.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ─── Stripe Payment Intent ────────────────────────────────────────────────────

  async createPaymentIntentByUserId(billId: string, userId: string): Promise<{ clientSecret: string }> {
    const parent = await this.prisma.parent.findUnique({ where: { userId } });
    if (!parent) throw new NotFoundException('Parent profile not found');
    return this.createPaymentIntent(billId, parent.id);
  }

  async createPaymentIntent(billId: string, parentId: string): Promise<{ clientSecret: string }> {
    const bill = await this.prisma.bill.findFirst({
      where: { id: billId, deletedAt: null },
    });

    if (!bill) throw new NotFoundException('Bill not found');
    if (bill.parentId !== parentId) throw new ForbiddenException('This bill does not belong to you');
    if (bill.isPaid) throw new BadRequestException('Bill is already paid');

    const paymentIntent = await this.stripeService.client.paymentIntents.create({
      amount: bill.amount,
      currency: 'thb',
      metadata: { billId: bill.id },
    });

    await this.prisma.bill.update({
      where: { id: billId },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return { clientSecret: paymentIntent.client_secret! };
  }

  // ─── Stripe Webhook ───────────────────────────────────────────────────────────

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: any;

    try {
      event = this.stripeService.client.webhooks.constructEvent(
        rawBody,
        signature,
        this.stripeService.webhookSecret,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      const billId = paymentIntent.metadata?.billId;
      if (billId) {
        await this.prisma.bill.updateMany({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: { isPaid: true, paidAt: new Date(), method: 'STRIPE' },
        });
      }
    }
  }

  // ─── Mapper ───────────────────────────────────────────────────────────────────

  private formatBillNumber(prefix: string, seq: number): string {
    return `${prefix}-${seq.toString().padStart(4, '0')}`;
  }

  private mapBillResponse(bill: any): BillResponseDto {
    return {
      id: bill.id,
      billNumber: bill.billNumber,
      title: bill.title,
      description: bill.description,
      amount: bill.amount,
      term: bill.term,
      year: bill.year,
      dueDate: bill.dueDate,
      isPaid: bill.isPaid,
      paidAt: bill.paidAt,
      method: bill.method,
      studentId: bill.studentId,
      studentName: `${bill.student.firstName} ${bill.student.lastName}`,
      parentId: bill.parentId,
      parentName: `${bill.parent.firstName} ${bill.parent.lastName}`,
      createdAt: bill.createdAt,
      updatedAt: bill.updatedAt,
    };
  }
}
