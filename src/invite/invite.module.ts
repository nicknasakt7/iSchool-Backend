import { Module } from '@nestjs/common';
import { InviteService } from './invite.service';
import { InviteController } from './invite.controller';
import { SecurityModule } from 'src/shared/security/security.module';
import { MailModule } from 'src/mail/mail.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [SecurityModule, MailModule, UserModule],
  providers: [InviteService],
  controllers: [InviteController],
})
export class InviteModule {}
