import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ParentService } from './parent.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';

@Controller('parents')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  // GET /parents/me
  @Roles(Role.PARENTS)
  @Get('me')
  getMe(@CurrentUser('sub') userId: string) {
    return this.parentService.getMe(userId);
  }

  // GET /parents/my-student
  @Roles(Role.PARENTS)
  @Get('my-student')
  getMyStudent(@CurrentUser('sub') userId: string) {
    return this.parentService.getMyStudent(userId);
  }
}
