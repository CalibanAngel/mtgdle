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

  app.enableCors({
    origin: [
      `http://${configHttp.front_host}:${configHttp.front_port}`,
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // only if you send cookies/auth headers cross-origin
  });


  await app.listen(configHttp.api_port ?? 3000);

  const logger = new Logger('bootstrap');

  logger.log(
    `Swagger can be found at http://${configHttp.api_host}:${configHttp.api_port}/api`,
  );
}
bootstrap();
