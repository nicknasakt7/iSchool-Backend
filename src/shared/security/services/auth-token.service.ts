import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { ResetPasswordTokenPayload } from 'src/auth/types/reset-password-token-payload.type';
import { TypedConfigService } from 'src/config/typed-config.service';

@Injectable()
export class AuthTokenService {
  constructor(
    private readonly typedConfigService: TypedConfigService,
    private readonly jwtService: JwtService,
  ) {}

  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.typedConfigService.get('JWT_SECRET'),
      expiresIn: this.typedConfigService.get('JWT_EXPIRES_IN'),
    });
  }

  signResetPasswordToken(
    payload: Omit<ResetPasswordTokenPayload, 'iat' | 'exp'>,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.typedConfigService.get('JWT_SECRET'),
      expiresIn: this.typedConfigService.get('RESET_PASSWORD_TOKEN_EXPIRES_IN'),
    });
  }

  verify(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.typedConfigService.get('JWT_SECRET'),
    });
  }

  verifyResetPasswordToken(token: string): Promise<ResetPasswordTokenPayload> {
    return this.jwtService.verifyAsync<ResetPasswordTokenPayload>(token, {
      secret: this.typedConfigService.get('JWT_SECRET'),
    });
  }
}
