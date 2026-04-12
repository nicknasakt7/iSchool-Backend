import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { ParentService, FindParentsQueryDto } from './parent.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/database/generated/prisma/enums';

@Controller('parents')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  // GET /parents — admin: list & search all parents
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get()
  findAll(@Query() query: FindParentsQueryDto) {
    return this.parentService.findAll(query);
  }

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
