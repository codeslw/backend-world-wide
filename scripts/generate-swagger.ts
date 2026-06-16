/**
 * Generate the OpenAPI/Swagger spec to swagger-spec.json without starting the
 * HTTP server or connecting to the database.
 *
 * Uses Nest "preview" mode so lifecycle hooks (e.g. PrismaService.onModuleInit,
 * which connects to Postgres) are skipped while the full module graph is still
 * built for Swagger introspection.
 *
 * Run: npx ts-node scripts/generate-swagger.ts
 */
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

async function generate() {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  app.setGlobalPrefix('api/v1');

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
  const outPath = join(__dirname, '..', 'swagger-spec.json');
  writeFileSync(outPath, JSON.stringify(document, null, 2));
  // eslint-disable-next-line no-console
  console.log(`Swagger spec written to ${outPath}`);
  await app.close();
}

generate()
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
