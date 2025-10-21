import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SwaggerAuthMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const swaggerUser = this.configService.get<string>('SWAGGER_USER');
    const swaggerPassword = this.configService.get<string>('SWAGGER_PASSWORD');

    // Skip authentication if credentials are not set
    if (!swaggerUser || !swaggerPassword) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Documentation"');
      return res.status(401).json({
        message: 'Authentication required for Swagger documentation',
        statusCode: 401,
      });
    }

    try {
      // Decode Basic Auth credentials
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');

      // Verify credentials
      if (username === swaggerUser && password === swaggerPassword) {
        return next();
      }

      // Invalid credentials
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Documentation"');
      return res.status(401).json({
        message: 'Invalid credentials for Swagger documentation',
        statusCode: 401,
      });
    } catch (error) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Swagger Documentation"');
      return res.status(401).json({
        message: 'Invalid authentication format',
        statusCode: 401,
      });
    }
  }
}