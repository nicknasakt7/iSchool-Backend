import { Module } from '@nestjs/common';

import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/guards/auth.guard';
import { AuthModule } from './auth/auth.module';
import { SecurityModule } from './shared/security/security.module';
import { UploadModule } from './shared/upload/upload.module';
import { UserModule } from './user/user.module';
import { RoleGuard } from './auth/guards/role.guard';
import { StudentModule } from './student/student.module';
import { SubjectModule } from './subject/subject.module';
import { TeacherModule } from './teacher/teacher.module';
import { ScoreModule } from './score/score.module';
import { ClassroomModule } from './classroom/classroom.module';
import { CalendarModule } from './calendar/calendar.module';
import { NoticeModule } from './notice/notice.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http.exception.filter';

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
    TeacherModule,
    ScoreModule,
    ClassroomModule,
    CalendarModule,
    NoticeModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    HttpExceptionFilter,
  ],
})
export class AppModule {}
