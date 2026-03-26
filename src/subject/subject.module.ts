import { Module } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { SubjectController } from './subject.controller';
import { PrismaService } from 'src/database/prisma.service';
import { SecurityModule } from 'src/shared/security/security.module';

@Module({
  imports: [SecurityModule],
  providers: [SubjectService, PrismaService],
  controllers: [SubjectController],
})
export class SubjectModule {}
