import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { UploadModule } from 'src/shared/upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
