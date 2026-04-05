import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService],
  imports: [DatabaseModule],
})
export class AttendanceModule {}
