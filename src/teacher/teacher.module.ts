import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { SecurityModule } from 'src/shared/security/security.module';
import { TeacherService } from './teacher.service';

@Module({
  controllers: [TeacherController],
  providers: [TeacherService],
  imports: [SecurityModule],
})
export class TeacherModule {}
