import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';
import { SecurityModule } from 'src/shared/security/security.module';

@Module({
  controllers: [TeacherController],
  providers: [TeacherService],
  imports: [SecurityModule],
})
export class TeacherModule {}
