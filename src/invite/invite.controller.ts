import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { InviteService } from './invite.service';
import { InviteParentDto } from './dtos/invite-parent.dto';
import { RegisterParentDto } from './dtos/register-parent.dto';

@Controller('invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Post('parent')
  async createParentInvite(@Body() inviteParentDto: InviteParentDto) {
    return this.inviteService.createParentInvite(inviteParentDto);
  }

  @Public()
  @Get('verify')
  async verifyInvite(@Query('token') token: string) {
    return this.inviteService.verifyInvite(token);
  }

  @Public()
  @Post('register-parent')
  async registerParent(
    @Body() registerParentDto: RegisterParentDto,
    @Query('token') token: string,
  ) {
    return this.inviteService.registerParent(registerParentDto, token);
  }
}
