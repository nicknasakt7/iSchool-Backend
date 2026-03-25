import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { CreateUserDto } from './dtos/create-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<void> {
    await this.userService.create(createUserDto);
  }
}
