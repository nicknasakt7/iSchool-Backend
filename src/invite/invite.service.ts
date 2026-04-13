import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/database/prisma.service';
import { TypedConfigService } from 'src/config/typed-config.service';
import { UserService } from 'src/user/user.service';
import { BcryptService } from 'src/shared/security/services/bcrypt.service';
import { AuthTokenService } from 'src/shared/security/services/auth-token.service';
import { MailService } from 'src/mail/mail.service';
import { Role } from 'src/database/generated/prisma/enums';
import { InviteParentDto } from './dtos/invite-parent.dto';
import { RegisterParentDto } from './dtos/register-parent.dto';

@Injectable()
export class InviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly authTokenService: AuthTokenService,
    private readonly typedConfigService: TypedConfigService,
    private readonly mailService: MailService,
  ) {}

  async createParentInvite(
    inviteParentDto: InviteParentDto,
  ): Promise<{ message: string }> {
    // ทำ email ให้เป็นรูปแบบเดียวกันก่อน
    const email = inviteParentDto.email.toLowerCase();

    // ถ้ามี user นี้อยู่แล้ว ไม่ควรส่ง invite ซ้ำ
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException({
        message: 'Email already exists',
        code: 'EMAIL_EXISTS',
      });
    }

    // ลบ invite เดิมที่ยังไม่ใช้ของ email นี้ก่อน
    // เพื่อให้เหลือ invite ล่าสุดอันเดียว
    await this.prisma.parentInvite.deleteMany({
      where: {
        email,
        usedAt: null,
      },
    });

    // สร้าง token แบบสุ่ม
    const token = randomBytes(32).toString('hex');

    // คำนวณวันหมดอายุจาก env
    const expiresInSeconds = this.typedConfigService.get('INVITE_EXPIRES_IN');
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // บันทึก invite ลง DB
    await this.prisma.parentInvite.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // สร้าง URL ไปหน้า register ฝั่ง frontend
    // ตัวอย่าง: http://localhost:3000/register?token=xxxxx
    const inviteUrl = new URL(this.typedConfigService.get('FRONTEND_URL'));
    inviteUrl.pathname = this.typedConfigService.get('INVITE_REGISTER_PATH');
    inviteUrl.searchParams.set('token', token);

    // ส่งเมล invite
    await this.mailService.sendParentInviteEmail(email, inviteUrl.toString());

    return {
      message: 'Parent invitation has been sent successfully',
    };
  }

  async verifyInvite(
    token: string,
  ): Promise<{ message: string; email: string }> {
    // ต้องมี token
    if (!token) {
      throw new BadRequestException({
        message: 'Token is required',
        code: 'TOKEN_REQUIRED',
      });
    }

    // หา invite จาก token
    const invite = await this.prisma.parentInvite.findUnique({
      where: { token },
    });

    // ถ้าไม่เจอ token
    if (!invite) {
      throw new BadRequestException({
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }

    // ถ้า token ถูกใช้ไปแล้ว
    if (invite.usedAt) {
      throw new BadRequestException({
        message: 'Token already used',
        code: 'TOKEN_ALREADY_USED',
      });
    }

    // ถ้า token หมดอายุแล้ว
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException({
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    // ส่ง email กลับไปด้วย เผื่อ frontend อยากเอาไป prefill form
    return {
      message: 'Invite token is valid',
      email: invite.email,
    };
  }

  async registerParent(registerParentDto: RegisterParentDto, token: string) {
    // ต้องมี token
    if (!token) {
      throw new BadRequestException({
        message: 'Token is required',
        code: 'TOKEN_REQUIRED',
      });
    }

    // กันกรณี email นี้มี user อยู่แล้ว
    const existingUser = await this.userService.findByEmail(
      registerParentDto.email,
    );
    if (existingUser) {
      throw new ConflictException({
        message: 'Email already exists',
        code: 'EMAIL_EXISTS',
      });
    }

    // หา invite จาก token
    const invite = await this.prisma.parentInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new BadRequestException({
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    }

    if (invite.usedAt) {
      throw new BadRequestException({
        message: 'Token already used',
        code: 'TOKEN_ALREADY_USED',
      });
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException({
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    // email ในฟอร์มต้องตรงกับ email ที่ถูก invite
    if (invite.email !== registerParentDto.email) {
      throw new BadRequestException({
        message: 'Email does not match invite',
        code: 'EMAIL_INVITE_MISMATCH',
      });
    }

    // hash password ก่อนเก็บ
    const hashedPassword = await this.bcryptService.hash(
      registerParentDto.password,
    );

    // ใช้ transaction เพื่อให้ create user / parent / update invite สำเร็จพร้อมกัน
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: registerParentDto.email,
          password: hashedPassword,
          role: Role.PARENTS,
          gender: 'OTHER',
        },
      });

      const parent = await tx.parent.create({
        data: {
          userId: user.id,
          firstName: registerParentDto.firstName,
          lastName: registerParentDto.lastName,
          tel: registerParentDto.tel,
          lineId: registerParentDto.lineId,
        },
      });

      // mark token ว่าใช้แล้ว
      await tx.parentInvite.update({
        where: { token },
        data: { usedAt: new Date() },
      });

      return { user, parent };
    });

    // สมัครเสร็จแล้ว sign access token ให้เลย
    const accessToken = await this.authTokenService.sign({
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    // ไม่ส่ง password กลับ
    const { password, ...userWithoutPassword } = result.user;

    return {
      accessToken,
      user: userWithoutPassword,
      parent: result.parent,
      expiresIn: this.typedConfigService.get('JWT_EXPIRES_IN'),
    };
  }
}
