import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
// import { redisStore } from 'cache-manager-redis-store';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Configuration
import { databaseConfig } from './config/database.config';
import { authConfig } from './config/auth.config';
import { redisConfig } from './config/redis.config';
import { openaiConfig } from './config/openai.config';
import { stripeConfig } from './config/stripe.config';
import { paystackConfig } from './config/paystack.config';
import { twilioConfig } from './config/twilio.config';
import { emailConfig } from './config/email.config';
import { slackConfig } from './config/slack.config';
import { calendlyConfig } from './config/calendly.config';

// Core Modules
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';

// Business Modules
import { CrmModule } from './modules/crm/crm.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AiModule } from './modules/ai/ai.module';
import { AdminModule } from './modules/admin/admin.module';

// Common Modules
import { HealthModule } from './modules/health/health.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { WidgetConfigModule } from './modules/widget-config/widget-config.module';
import { CustomThrottleGuard } from './common/guards/throttle.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        authConfig,
        redisConfig,
        openaiConfig,
        stripeConfig,
        paystackConfig,
        twilioConfig,
        emailConfig,
        slackConfig,
        calendlyConfig,
      ],
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    // Logging
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        level: configService.get('LOG_LEVEL', 'info'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple(),
            ),
          }),
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
          }),
        ],
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
            limit: configService.get('RATE_LIMIT_MAX_REQUESTS', 100),
          },
        ],
      }),
    }),

    // Caching (using memory store for now, can be configured for Redis later)
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: 300, // 5 minutes default
        max: 1000, // Maximum number of items in cache
      }),
      isGlobal: true,
    }),

    // Job queues - disabled for now
    // BullModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     redis: {
    //       host: configService.get('REDIS_HOST', 'localhost'),
    //       port: configService.get('REDIS_PORT', 6379),
    //       ...(configService.get('REDIS_PASSWORD') && {
    //         password: configService.get('REDIS_PASSWORD'),
    //       }),
    //     },
    //     defaultJobOptions: {
    //       removeOnComplete: 10,
    //       removeOnFail: 5,
    //       attempts: configService.get('QUEUE_MAX_ATTEMPTS', 3),
    //       backoff: {
    //         type: 'exponential',
    //         delay: 2000,
    //       },
    //     },
    //   }),
    // }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Event emitter
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Core modules
    DatabaseModule,
    AuthModule,
    TenantsModule,
    UsersModule,

    // Business modules
    CrmModule,
    AppointmentsModule,
    PaymentsModule,
    MessagingModule,
    CampaignsModule,
    AiModule,
    AdminModule,

    // Common Modules
    HealthModule,
    FilesModule,
    NotificationsModule,
    WebhooksModule,
    AnalyticsModule,
    WebSocketModule,
    WidgetConfigModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottleGuard,
    },
  ],
})
export class AppModule {}
