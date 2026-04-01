import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TypedConfigService } from 'src/config/typed-config.service';
import { AuthTokenService } from 'src/shared/security/services/auth-token.service';
import { BcryptService } from 'src/shared/security/services/bcrypt.service';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dtos/login.dto';
import { PrismaService } from 'src/database/prisma.service';
import { RegisterParentDto } from './dtos/register-parent.dto';
import { Role } from 'src/database/generated/prisma/enums';
import { CreateAdminDto } from './dtos/create-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly authTokenService: AuthTokenService,
    private readonly typedConfigService: TypedConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // LOGIN
  async login(loginDto: LoginDto) {
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException({
        message: 'The provided email or password is incorrect',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const isMatch = await this.bcryptService.compare(
      loginDto.password,
      user.password,
    );

    if (!isMatch) {
      throw new UnauthorizedException({
        message: 'The provided email or password is incorrect',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const accessToken = await this.authTokenService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
      expiresIn: this.typedConfigService.get('JWT_EXPIRES_IN'),
    };
  }

  // REGISTER PARENT
  async registerParent(registerParentDto: RegisterParentDto) {
    const existing = await this.userService.findByEmail(
      registerParentDto.email,
    );

    if (existing) {
      throw new ConflictException({
        message: 'Email already exists',
        code: 'EMAIL_EXISTS',
      });
    }

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

    const hashedPassword = await this.bcryptService.hash(
      registerParentDto.password,
    );

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

      await tx.parentInvite.update({
        where: { token: registerParentDto.token },
        data: { usedAt: new Date() },
      });

      return { user, parent };
    });

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

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
    };
  }

  // GET ME
  async getMe(id: string) {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}
