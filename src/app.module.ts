import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard';
import { AuthModule } from './auth/auth.module';
import { SecurityModule } from './shared/security/security.module';
import { UploadModule } from './shared/upload/upload.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    SecurityModule,
    UploadModule,
    UserModule,
    DatabaseModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
