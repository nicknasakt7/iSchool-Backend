import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { randomUUID } from 'crypto';
import { TypedConfigService } from 'src/config/typed-config.service';

@Injectable()
export class InviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly typedConfigService: TypedConfigService,
  ) {}

  async createParentInvite(email: string) {
    // 1. check invite ค้าง
    const existing = await this.prisma.parentInvite.findFirst({
      where: {
        email,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existing) {
      throw new BadRequestException({
        message: 'Invite already exists for this email',
        code: 'INVITE_EXISTS',
      });
    }

    // 2. generate token
    const token = randomUUID();

    // 3. get expire config
    const expiresIn = this.typedConfigService.get('INVITE_EXPIRES_IN');

    if (!expiresIn) {
      throw new Error('INVITE_EXPIRES_IN is not defined');
    }

    const expiresInSeconds = Number(expiresIn);

    if (isNaN(expiresInSeconds)) {
      throw new Error('INVITE_EXPIRES_IN must be a number');
    }

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // 4. save
    const invite = await this.prisma.parentInvite.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // 5. build link
    const frontendUrl = this.typedConfigService.get('FRONTEND_URL');

    const registerPath = this.typedConfigService.get('INVITE_REGISTER_PATH');

    if (!frontendUrl || !registerPath) {
      throw new Error('Frontend config is missing');
    }

    const inviteLink = `${frontendUrl}${registerPath}?token=${token}`;

    return {
      email: invite.email,
      token: invite.token,
      expiresAt: invite.expiresAt,
      inviteLink,
    };
  }
}
