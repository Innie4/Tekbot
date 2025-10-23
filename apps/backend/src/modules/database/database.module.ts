import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');

        const commonOptions = {
          type: 'postgres' as const,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: true, // Enable for development
          logging: false,
          ssl: false,
          retryAttempts: 1,
          retryDelay: 1000,
          autoLoadEntities: true,
        };

        if (url) {
          return { ...commonOptions, url };
        }

        return {
          ...commonOptions,
          host: configService.get<string>('DATABASE_HOST', 'localhost'),
          port: configService.get<number>('DATABASE_PORT', 5432),
          username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
          password: configService.get<string>('DATABASE_PASSWORD', ''),
          database: configService.get<string>('DATABASE_NAME', 'tekbot'),
        };
      },
    }),
  ],
  providers: [DatabaseService],
  exports: [TypeOrmModule, DatabaseService],
})
export class DatabaseModule {}