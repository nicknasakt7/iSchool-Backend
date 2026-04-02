import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { SecurityModule } from 'src/shared/security/security.module';
import { TeacherService } from './teacher.service';
import { UploadModule } from 'src/shared/upload/upload.module';

@Module({
  controllers: [TeacherController],
  providers: [TeacherService],
  imports: [SecurityModule, UploadModule],
})
export class TeacherModule {}
