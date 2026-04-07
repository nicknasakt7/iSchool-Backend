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
import { UserResponseDto } from 'src/user/dtos/user-response.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly authTokenService: AuthTokenService,
    private readonly typedConfigService: TypedConfigService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
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

  async registerParent(registerParentDto: RegisterParentDto, token: string) {
    if (!token) {
      throw new BadRequestException({
        message: 'Token is required',
        code: 'TOKEN_REQUIRED',
      });
    }

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

    if (invite.email !== registerParentDto.email) {
      throw new BadRequestException({
        message: 'Email does not match invite',
        code: 'EMAIL_INVITE_MISMATCH',
      });
    }

    const hashedPassword = await this.bcryptService.hash(
      registerParentDto.password,
    );

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

      await tx.parentInvite.update({
        where: { token },
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
  async getMe(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        teacher: true,
        parent: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user as UserResponseDto;
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    // const user = await this.userService.findByEmail(forgotPasswordDto.email);
    // if (!user)
    //   throw new BadRequestException({
    //     message: 'Email not found',
    //     code: 'EMAIL_NOT_FOUND',
    //   });
    // console.log('user ==>', user);
    // const accessToken = await this.authTokenService.signResetPasswordToken({
    //   sub: user.id,
    //   email: user.email,
    //   type: 'RESET_PASSWORD',
    // });
    const accessToken = await this.authTokenService.signResetPasswordToken({
      sub: 'big',
      email: 'big@gmail.com',
      type: 'RESET_PASSWORD',
    });

    const resetUrl = new URL(
      this.typedConfigService.get('FRONTEND_RESET_PASSWORD_URL'),
    );
    resetUrl.searchParams.set('token', accessToken);

    // this.mailService
    //   .sendResetPasswordEmail(user.email, resetUrl.toString())
    //   .catch((error) => {
    //     console.error('Send reset password email failed:', error);
    //   });

    this.mailService
      .sendResetPasswordEmail(forgotPasswordDto.email, resetUrl.toString())
      .catch((error) => {
        console.error('Send reset password email failed:', error);
      });

    return Promise.resolve({ message: 'success' });
  }

  // async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
  //   let payload: unknown;
  //   try {
  //     payload = await this.authTokenService.verifyResetPasswordToken(
  //       resetPasswordDto.token,
  //     );
  //   } catch (error) {
  //     if (error instanceof Error && error.name === 'TokenExpiredError')
  //       throw new UnauthorizedException({
  //         message: 'Reset password token has expired',
  //         code: 'RESET_PASSWORD_TOKEN_EXPIRED',
  //       });

  //     if (error instanceof Error && error.name === 'JsonWebTokenError')
  //       throw new UnauthorizedException({
  //         message: 'Invalid reset password token',
  //         code: 'INVALID_RESET_PASSWORD_TOKEN',
  //       });

  //     throw error;
  //   }

  //   if (!this.isResetPasswordPayload(payload))
  //     throw new UnauthorizedException({
  //       message: 'Invalid reset password token',
  //       code: 'INVALID_RESET_PASSWORD_TOKEN',
  //     });

  //   const user = await this.userService.findByEmail(payload.email);
  //   if (!user || user.id !== payload.sub)
  //     throw new UnauthorizedException({
  //       message: 'Invalid reset password token',
  //       code: 'INVALID_RESET_PASSWORD_TOKEN',
  //     });

  //   const hashedPassword = await this.bcryptService.hash(
  //     resetPasswordDto.password,
  //   );
  //   await this.userService.updatePassword(user.id, hashedPassword);
  // }
}
