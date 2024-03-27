import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as compression from 'compression';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(compression());
  app.enableCors();

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

  // use YTCHAT_BACKEND_PORT environment variable as listening port
  const port = process.env.YTCHAT_BACKEND_PORT
    ? process.env.YTCHAT_BACKEND_PORT
    : 3000;
  await app.listen(port);
}
bootstrap().then();
