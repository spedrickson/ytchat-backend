import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';
import { urlencoded, json } from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
  app.enableCors();
  app.use(json({ limit: '50mb' })); // increased limit to accept lists of banned users for large channels. set lower if not needed.
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const config = new DocumentBuilder()
    .setTitle('YTChat API')
    .setDescription(
      'API for YTChat mod stuff like message history and user info',
    )
    .setVersion('1.0.0')
    .build();

  // initiate swagger docs
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000);
}
bootstrap().then();
