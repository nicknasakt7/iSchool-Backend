import { Controller, Post, Body } from '@nestjs/common';
import { InviteService } from './invite.service';
import { CreateParentInviteDto } from './dtos/create-parent-invite.dto';
import { Role } from 'src/database/generated/prisma/enums';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('invites')
export class InviteController {
  constructor(private readonly inviteService: InviteService) {}

  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('parents')
  async createParentInvite(
    @Body() createParentInviteDto: CreateParentInviteDto,
  ) {
    return this.inviteService.createParentInvite(createParentInviteDto.email);
  }
}
