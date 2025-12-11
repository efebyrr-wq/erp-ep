import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    const errorDetails =
      exception instanceof Error ? exception.stack : String(exception);

    this.logger.error(
      `Exception caught: ${request.method} ${request.url}`,
      errorDetails,
    );

    response.status(status).json({
      statusCode: status,
      message: typeof message === 'string' ? message : (message as any).message || 'Internal server error',
      error: typeof message === 'object' ? (message as any).error : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}





