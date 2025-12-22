import { ValidationPipe, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { json, urlencoded } from 'express';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const corsOrigins = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS, // comma-separated list
    process.env.CORS_ORIGINS,   // comma-separated list
    'https://main.d1054i3y445g1d.amplifyapp.com', // Amplify frontend
    'https://*.amplifyapp.com', // All Amplify apps
  ]
    .filter(Boolean)
    .flatMap((value) =>
      value!.split(',').map((v) => v.trim()).filter((v) => v.length > 0),
    );

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: corsOrigins.length > 0 ? corsOrigins : true,
      credentials: true,
    },
    bodyParser: false, // Disable default body parser to configure custom limits
  });
  
  // Increase body size limit to 50MB for large file uploads (base64 encoded PDFs/images)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  
  // Add global exception filter to catch all errors
  app.useGlobalFilters(new AllExceptionsFilter());
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const messages = errors.map((error) =>
          Object.values(error.constraints || {}).join(', '),
        );
        logger.error('Validation failed:', messages);
        return new HttpException(
          { message: messages.join('; '), statusCode: HttpStatus.BAD_REQUEST },
          HttpStatus.BAD_REQUEST,
        );
      },
    }),
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`🚀 Backend listening on http://localhost:${port}`);
  logger.log(`📡 CORS enabled for: ${corsOrigins.length > 0 ? corsOrigins.join(', ') : 'all origins'}`);
}

bootstrap().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});
