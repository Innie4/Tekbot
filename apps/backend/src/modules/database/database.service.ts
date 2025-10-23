import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.testConnection();
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.dataSource.isInitialized) {
        await this.dataSource.query('SELECT 1');
        this.logger.log('✅ Database connection successful');
        return true;
      } else {
        this.logger.error('❌ Database connection not initialized');
        return false;
      }
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error.message);
      return false;
    }
  }

  async getConnectionInfo() {
    return {
      isConnected: this.dataSource.isInitialized,
      database: this.configService.get('DATABASE_NAME'),
      host: this.configService.get('DATABASE_HOST'),
      port: this.configService.get('DATABASE_PORT'),
    };
  }

  async executeQuery(query: string, parameters?: any[]): Promise<any> {
    try {
      return await this.dataSource.query(query, parameters);
    } catch (error) {
      this.logger.error(`Query execution failed: ${error.message}`);
      throw error;
    }
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
