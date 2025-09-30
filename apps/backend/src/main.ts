import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false, // We'll use Winston
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3001');

  // Use Winston logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: nodeEnv === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));

  // Compression middleware
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: configService.get<boolean>('CORS_CREDENTIALS', true),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Tenant-ID',
    ],
  });

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters (order matters - most specific first)
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new AllExceptionsFilter(),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new TimeoutInterceptor(),
    new LoggingInterceptor(),
    new TransformInterceptor(app.get('Reflector')),
  );

  // Swagger documentation (only in development)
  if (nodeEnv === 'development' || configService.get<boolean>('ENABLE_SWAGGER', false)) {
    const config = new DocumentBuilder()
      .setTitle('TekBot Platform API')
      .setDescription('Multi-tenant AI assistant engine API documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-Tenant-ID',
          in: 'header',
          description: 'Tenant identifier',
        },
        'tenant-key',
      )
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Tenants', 'Multi-tenant management')
      .addTag('CRM', 'Customer relationship management')
      .addTag('Appointments', 'Appointment scheduling and management')
      .addTag('Payments', 'Payment processing and links')
      .addTag('Messaging', 'Multi-channel communication')
      .addTag('Campaigns', 'Automated campaigns and reminders')
      .addTag('AI', 'AI and LLM integration')
      .addTag('Admin', 'Administrative functions')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }

  // Global prefix
  app.setGlobalPrefix('api');

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);

  console.log(`🚀 TekBot Platform API is running on: http://localhost:${port}/api`);
  if (nodeEnv === 'development') {
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Error starting server:', error);
  process.exit(1);
});