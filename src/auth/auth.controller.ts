import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
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
  async registerParent(
    @Query('token') token: string,
    @Body() registerParentDto: RegisterParentDto,
  ) {
    return this.authService.registerParent(registerParentDto, token);
  }

  // CREATE ADMIN (SUPER_ADMIN only)
  @Roles(Role.SUPER_ADMIN)
  @Post('create-admin')
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.authService.createAdmin(createAdminDto);
  }

  // GET ME
  @Get('me')
  getMe(@CurrentUser('sub') id: string): Promise<UserWithoutPassword> {
    return this.authService.getMe(id);
  }
}
