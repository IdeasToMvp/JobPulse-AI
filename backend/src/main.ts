import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { validateEnv } from './config/validate-env';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const origins = config.get<string[]>('corsOrigins') ?? [];
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    credentials: true,
  });

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Listening on 0.0.0.0:${port}`);
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
