import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import { Request, Response } from 'express';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply global validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const formatErrors = (errors) => {
          return errors.reduce((acc, err) => {
            if (err.children && err.children.length > 0) {
              acc[err.property] = formatErrors(err.children);
            } else {
              acc[err.property] = Object.values(err.constraints || {});
            }
            return acc;
          }, {});
        };

        const formattedErrors = formatErrors(errors);

        return new Error(
          JSON.stringify({
            statusCode: 400,
            message: 'Validation failed',
            error: 'Bad Request',
            details: formattedErrors,
          }),
        );
      },
    }),
  );

  // Apply global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

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

  // Add Swagger UI options for auth persistence
  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true, // Keep authorization data between page refreshes
      defaultModelsExpandDepth: 0, // Hide schemas section by default
      tagsSorter: 'alpha', // Sort tags alphabetically
      operationsSorter: 'alpha', // Sort operations alphabetically
    },
    customSiteTitle: 'EduWorldWide API Docs v2.0.1',
  };

  SwaggerModule.setup('api', app, document, customOptions);

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

  // Basic health check endpoint
  app.use('/api/v1/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
