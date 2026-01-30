import { NestFactory } from '@nestjs/core';
// Rebuild trigger 1
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response, NextFunction } from 'express';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SwaggerAuthMiddleware } from './common/middleware/swagger-auth.middleware';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

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

        // Return a proper NestJS exception instead of generic Error
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          error: 'Bad Request',
          details: formattedErrors,
        });
      },
    }),
  );

  // Apply global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Apply base context for apis api/v1
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
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 0,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'EduWorldWide API Docs v2.0.1',
  };

  // Apply Swagger authentication middleware to Swagger routes
  const swaggerAuth = new SwaggerAuthMiddleware(configService);
  app.use('/api-docs', (req: Request, res: Response, next: NextFunction) => {
    swaggerAuth.use(req, res, next);
  });
  app.use(
    '/swagger-spec',
    (req: Request, res: Response, next: NextFunction) => {
      swaggerAuth.use(req, res, next);
    },
  );

  // Setup Swagger at /api-docs to avoid conflict with /api/v1 prefix
  SwaggerModule.setup('api-docs', app, document, customOptions);

  // Expose Swagger document at /swagger-spec endpoint
  app.getHttpAdapter().get('/swagger-spec', (req: Request, res: Response) => {
    res.json(document);
  });

  // Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
    maxAge: 86400,
  });

  // Basic health check endpoint (only responds to GET)
  app.getHttpAdapter().get('/api/v1/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
