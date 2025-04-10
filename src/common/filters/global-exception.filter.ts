import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ErrorResponse } from '../exceptions/app.exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Create a base error response
    let errorResponse: ErrorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error'
    };
    
    // Handle HTTP exceptions (including our custom exceptions)
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      
      // If our custom error format is used
      if (typeof exceptionResponse === 'object' && 
          'statusCode' in (exceptionResponse as ErrorResponse) &&
          'message' in (exceptionResponse as ErrorResponse) &&
          'error' in (exceptionResponse as ErrorResponse)) {
        errorResponse = exceptionResponse as ErrorResponse;
      } else {
        // Standard NestJS HttpException
        errorResponse = {
          statusCode: exception.getStatus(),
          message: typeof exceptionResponse === 'string' 
            ? exceptionResponse 
            : (exceptionResponse as Record<string, any>).message || 'An error occurred',
          error: HttpStatus[exception.getStatus()]
        };
      }
    } 
    // Handle Prisma client errors
    else if (exception instanceof PrismaClientKnownRequestError) {
      const meta = exception.meta as Record<string, any> | undefined;
      
      switch (exception.code) {
        case 'P2002': // Unique constraint failure
          errorResponse = {
            statusCode: HttpStatus.CONFLICT,
            message: `Unique constraint violation: ${meta?.target instanceof Array ? meta.target.join(', ') : 'unknown field'}`,
            error: 'Conflict'
          };
          break;
        case 'P2025': // Record not found
          errorResponse = {
            statusCode: HttpStatus.NOT_FOUND,
            message: meta?.cause as string || 'Record not found',
            error: 'Not Found'
          };
          break;
        case 'P2003': // Foreign key constraint failure
          errorResponse = {
            statusCode: HttpStatus.BAD_REQUEST,
            message: `Foreign key constraint failed: ${meta?.field_name as string || 'unknown field'}`,
            error: 'Bad Request'
          };
          break;
        default:
          errorResponse = {
            statusCode: HttpStatus.BAD_REQUEST,
            message: `Database error: ${exception.message}`,
            error: 'Bad Request'
          };
      }
    } 
    // Handle other errors
    else if (exception instanceof Error) {
      errorResponse = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message || 'An unexpected error occurred',
        error: 'Internal Server Error'
      };
    }
    
    // Log the error (with different level based on severity)
    const logMethod = errorResponse.statusCode >= 500 
      ? this.logger.error.bind(this.logger) 
      : this.logger.warn.bind(this.logger);
    
    logMethod(
      `${request.method} ${request.url} - ${errorResponse.statusCode} ${errorResponse.message}`,
      exception instanceof Error ? exception.stack : 'No stack trace available'
    );
    
    // Send response
    response
      .status(errorResponse.statusCode)
      .json(errorResponse);
  }
} 