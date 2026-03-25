import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TypedConfigService } from 'src/config/typed-config.service';
import { AuthTokenService } from 'src/shared/security/services/auth-token.service';
import { BcryptService } from 'src/shared/security/services/bcrypt.service';
import { UserWithoutPassword } from 'src/user/types/user.type';
import { UserService } from 'src/user/user.service';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly bcryptService: BcryptService,
    private readonly authTokenService: AuthTokenService,
    private readonly typedConfigService: TypedConfigService,
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
}
