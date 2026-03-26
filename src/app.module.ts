import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard';
import { AuthModule } from './auth/auth.module';
import { SecurityModule } from './shared/security/security.module';
import { UploadModule } from './shared/upload/upload.module';
import { UserModule } from './user/user.module';
import { RoleGuard } from './auth/guards/role.guard';
import { StudentModule } from './student/student.module';
import { SubjectModule } from './subject/subject.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    SecurityModule,
    UploadModule,
    UserModule,
    DatabaseModule,
    StudentModule,
    SubjectModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule {}
