import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BcryptService } from './services/bcrypt.service';
import { AuthTokenService } from './services/auth-token.service';

@Module({
  imports: [JwtModule],
  providers: [BcryptService, AuthTokenService],
  exports: [BcryptService, AuthTokenService],
})
export class SecurityModule {}
