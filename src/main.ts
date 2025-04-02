import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import 'reflect-metadata';
import { Configuration } from '../config/configuration';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConsoleLogger } from '@nestjs/common';

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

  const configHttp = app
    .get<ConfigService<Configuration>>(ConfigService)
    .get('http', { infer: true });

  await app.listen(configHttp.port ?? 3000);
}
bootstrap();
