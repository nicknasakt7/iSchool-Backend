import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TypedConfigService } from 'src/config/typed-config.service';
import { AuthTokenService } from 'src/shared/security/services/auth-token.service';
import { BcryptService } from 'src/shared/security/services/bcrypt.service';
import { UserWithoutPassword } from 'src/user/types/user.type';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dtos/login.dto';
import { PrismaService } from 'src/database/prisma.service';
import { RegisterParentDto } from './dtos/register-parent.dto';
import { Role } from 'src/database/generated/prisma/enums';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { User } from 'src/database/generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly authTokenService: AuthTokenService,
    private readonly typedConfigService: TypedConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto): Promise<{
    accessToken: string;
    user: UserWithoutPassword;
    expiresIn: number;
  }> {
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user)
      throw new UnauthorizedException({
        message: 'The provided email or password is incorrect',
        code: 'INVALID_CREDENTIALS',
      });

    const isMatch = await this.bcryptService.compare(
      loginDto.password,
      user.password,
    );
    if (!isMatch)
      throw new UnauthorizedException({
        message: 'The provided email or password is incorrect',
        code: 'INVALID_CREDENTIALS',
      });

    const accessToken = await this.authTokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const { password, ...rest } = user;
    return {
      accessToken,
      user: rest,
      expiresIn: this.typedConfigService.get('JWT_EXPIRES_IN'),
    };
  }

  async registerParent(registerParentDto: RegisterParentDto) {
    // 1. check email ซ้ำก่อน
    const existing = await this.userService.findByEmail(
      registerParentDto.email,
    );

    if (existing) {
      throw new ConflictException({
        message: 'Email already exists',
        code: 'EMAIL_EXISTS',
      });
    }

    // 2. validate token (ใส่ตรงนี้)
    const invite = await this.prisma.parentInvite.findUnique({
      where: { token: registerParentDto.token },
    });

    if (!invite) {
      throw new BadRequestException('Invalid token');
    }

    if (invite.usedAt) {
      throw new BadRequestException('Token already used');
    }

    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Token expired');
    }

    // 3. hash password
    const hashedPassword = await this.bcryptService.hash(
      registerParentDto.password,
    );

    // 4. transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: registerParentDto.email,
          password: hashedPassword,
          role: registerParentDto.role,
          gender: registerParentDto.gender,
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

      // 5. mark token ว่าใช้แล้ว (สำคัญมาก)
      await tx.parentInvite.update({
        where: { token: registerParentDto.token },
        data: {
          usedAt: new Date(),
        },
      });

      return { user, parent };
    });

    // 6. generate token
    const accessToken = await this.authTokenService.sign({
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    const { password, ...userWithoutPassword } = result.user;

    return {
      accessToken,
      user: userWithoutPassword,
      parent: result.parent,
      expiresIn: this.typedConfigService.get('JWT_EXPIRES_IN'),
    };
  }

  // CREATE ADMIN
  async createAdmin(createAdminDto: CreateAdminDto) {
    const existing = await this.userService.findByEmail(createAdminDto.email);

    if (existing) {
      throw new ConflictException({
        message: 'Email already exists',
        code: 'EMAIL_EXISTS',
      });
    }

    const hashedPassword = await this.bcryptService.hash(
      createAdminDto.password,
    );

    const user = await this.prisma.user.create({
      data: {
        email: createAdminDto.email,
        password: hashedPassword,
        role: Role.ADMIN,
        gender: createAdminDto.gender,
      },
    });

    const { password, ...rest } = user;

    return {
      user: rest,
    };
  }

  // GET ME
  async getMe(id: string): Promise<User> {
    return this.userService.findById(id);
  }
}
