import {
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
import { Role } from 'src/database/generated/prisma/enums';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { UserResponseDto } from 'src/user/dtos/user-response.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { MailService } from 'src/mail/mail.service';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ResetPasswordTokenPayload } from './types/reset-password-token-payload.type';

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

  // ForgotPassword
  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);

    if (user) {
      const accessToken = await this.authTokenService.signResetPasswordToken({
        sub: user.id,
        email: user.email,
        type: 'RESET_PASSWORD',
      });

      const resetUrl = new URL(
        this.typedConfigService.get('FRONTEND_RESET_PASSWORD_URL'),
      );
      resetUrl.searchParams.set('token', accessToken);

      await this.mailService
        .sendResetPasswordEmail(
          user.email,
          resetUrl.toString(),
          user.parent?.firstName ?? undefined,
        )
        .catch((error) => {
          console.error('Send reset password email failed:', error);
        });
    }

    return {
      message: 'If that email exists, a reset link has been sent.',
    };
  }

  // ResetPassword
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    let payload: ResetPasswordTokenPayload;

    try {
      payload = await this.authTokenService.verifyResetPasswordToken(
        resetPasswordDto.token,
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          message: 'Reset password token has expired',
          code: 'RESET_PASSWORD_TOKEN_EXPIRED',
        });
      }

      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          message: 'Invalid reset password token',
          code: 'INVALID_RESET_PASSWORD_TOKEN',
        });
      }

      throw error;
    }

    if (payload.type !== 'RESET_PASSWORD') {
      throw new UnauthorizedException({
        message: 'Invalid reset password token',
        code: 'INVALID_RESET_PASSWORD_TOKEN',
      });
    }

    const user = await this.userService.findByEmail(payload.email);

    if (!user || user.id !== payload.sub) {
      throw new UnauthorizedException({
        message: 'Invalid reset password token',
        code: 'INVALID_RESET_PASSWORD_TOKEN',
      });
    }

    const hashedPassword = await this.bcryptService.hash(
      resetPasswordDto.password,
    );

    await this.userService.updatePassword(user.id, hashedPassword);

    return {
      message: 'Password has been reset successfully',
    };
  }
}
