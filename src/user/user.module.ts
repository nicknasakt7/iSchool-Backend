import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SecurityModule } from 'src/shared/security/security.module';
import { UploadModule } from 'src/shared/upload/upload.module';

@Module({
  imports: [SecurityModule, UploadModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
