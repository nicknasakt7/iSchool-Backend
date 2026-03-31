import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dtos/login.dto';
import { UserWithoutPassword } from 'src/user/types/user.type';
import { RegisterParentDto } from './dtos/register-parent.dto';
import { Roles } from './decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';
import { CreateAdminDto } from './dtos/create-admin.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from 'src/database/generated/prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<{
    accessToken: string;
    user: UserWithoutPassword;
    expiresIn: number;
  }> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register-parent')
  async registerParent(@Body() registerParentDto: RegisterParentDto) {
    return this.authService.registerParent(registerParentDto);
  }

  // CREATE ADMIN (SUPER_ADMIN only)
  @Roles(Role.SUPER_ADMIN)
  @Post('create-admin')
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.authService.createAdmin(createAdminDto);
  }

  // GET ME
  @Get('me')
  getMe(@CurrentUser('sub') id: string): Promise<User> {
    return this.authService.getMe(id);
  }
}
