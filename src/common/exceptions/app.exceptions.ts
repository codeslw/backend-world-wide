import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, any>;
}

export class EntityNotFoundException extends HttpException {
  constructor(entityName: string, identifier?: string | number) {
    const message = identifier 
      ? `${entityName} with identifier ${identifier} not found`
      : `${entityName} not found`;
    
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message,
        error: 'Not Found',
      } as ErrorResponse,
      HttpStatus.NOT_FOUND
    );
  }
}

export class InvalidDataException extends HttpException {
  constructor(message: string, details?: Record<string, any>) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'Bad Request',
        details,
      } as ErrorResponse,
      HttpStatus.BAD_REQUEST
    );
  }
}

export class UnauthorizedAccessException extends HttpException {
  constructor(message = 'Unauthorized access') {
    super(
      {
        statusCode: HttpStatus.UNAUTHORIZED,
        message,
        error: 'Unauthorized',
      } as ErrorResponse,
      HttpStatus.UNAUTHORIZED
    );
  }
}

export class ForbiddenActionException extends HttpException {
  constructor(message = 'Access to this resource is forbidden') {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        message,
        error: 'Forbidden',
      } as ErrorResponse,
      HttpStatus.FORBIDDEN
    );
  }
}

export class ConflictException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.CONFLICT,
        message,
        error: 'Conflict',
      } as ErrorResponse,
      HttpStatus.CONFLICT
    );
  }
}

export class ServerErrorException extends HttpException {
  constructor(message = 'Internal server error') {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        error: 'Internal Server Error',
      } as ErrorResponse,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
} 