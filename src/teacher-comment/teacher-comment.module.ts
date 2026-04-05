import { Module } from '@nestjs/common';
import { TeacherCommentService } from './teacher-comment.service';
import { TeacherCommentController } from './teacher-comment.controller';

@Module({
  providers: [TeacherCommentService],
  controllers: [TeacherCommentController]
})
export class TeacherCommentModule {}
