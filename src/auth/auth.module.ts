import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SecurityModule } from 'src/shared/security/security.module';
import { UserModule } from 'src/user/user.module';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [UserModule, SecurityModule, MailModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
