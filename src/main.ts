import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';
import { GlobalValidationPipe } from './common/pipes/global-validation.pipe';
import { HttpExceptionFilter } from './common/filters/http.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new GlobalValidationPipe());
  app.useGlobalFilters(app.get(HttpExceptionFilter));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Nest application failed during bootstrap',
    error instanceof Error ? error.message : 'Unexpected occured error',
  );
});
