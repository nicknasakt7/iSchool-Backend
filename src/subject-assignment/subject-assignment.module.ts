import { Module } from '@nestjs/common';
import { SubjectAssignmentService } from './subject-assignment.service';
import { SubjectAssignmentController } from './subject-assignment.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  providers: [SubjectAssignmentService],
  controllers: [SubjectAssignmentController],
  imports: [DatabaseModule],
})
export class SubjectAssignmentModule {}
