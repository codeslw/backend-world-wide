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
  //i want to send the swagger-spec.json file to the frontend when the swagger is opened
  
  app.getHttpAdapter().get('/swagger-spec.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  // Ensure the Swagger UI fetches the spec when opened
  app.getHttpAdapter().use('/api', (req, res, next) => {
    if (req.path === '/swagger-ui.html') {
      res.redirect('/swagger-spec.json');
    } else {
      next();
    }
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