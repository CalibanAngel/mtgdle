import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import 'reflect-metadata';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { Configuration } from '@mtgdle/common/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger(),
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mtgdle')
    .setDescription('The mtgdle API description')
    .setVersion('1.0')
    .build();

  const swaggerFactory = () => SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api', app, swaggerFactory);

  app.useGlobalPipes(new ValidationPipe());

  const configHttp = app
    .get<ConfigService<Configuration>>(ConfigService)
    .getOrThrow('http', { infer: true });

  await app.listen(configHttp.port ?? 3000);

  const logger = new Logger('bootstrap');

  logger.log(
    `Swagger can be found at http://${configHttp.host}:${configHttp.port}/api`,
  );
}
bootstrap();
