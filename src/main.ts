import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { Request, Response } from 'express';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply global validation pipe
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  //Apply base context for apis api/v1
  app.setGlobalPrefix('api/v1');

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('EduWorldWide API')
    .setDescription('API documentation for EduWorldWide backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token', // This is the key used for @ApiBearerAuth() decorator
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  

   // Expose Swagger document at /swagger-spec endpoint
   app.getHttpAdapter().get('/swagger-spec', (req, res) => {
    res.json(document);
  });
  
  // Enable CORS
  app.enableCors({
    origin: true, // Or specify your frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
    maxAge: 86400, // 24 hours
  });
  
  await app.listen(process.env.PORT || 3000);
}
bootstrap();