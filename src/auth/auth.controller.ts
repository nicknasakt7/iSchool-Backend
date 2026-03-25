import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Public()
  // @HttpCode(HttpStatus.OK)
  // @Post('login')
  // login(@Body() loginDto: LoginDto): Promise<{
  //   accessToken: string;
  //   user: UserWithoutPassword;
  //   expiresIn: number;
  // }> {
  //   return this.authService.login(loginDto);
  // }
}
