import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly startTime = Date.now();

  constructor(private readonly configService: ConfigService) {}

  getAppInfo() {
    const packageJson = require('../package.json');

    return {
      name: packageJson.name || 'TekBot Platform API',
      version: packageJson.version || '1.0.0',
      description:
        packageJson.description || 'Multi-tenant AI assistant engine',
      environment: this.configService.get('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
    };
  }

  getHealth() {
    const memoryUsage = process.memoryUsage();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      },
      pid: process.pid,
      nodeVersion: process.version,
    };
  }

  getVersion() {
    const packageJson = require('../package.json');

    return {
      version: packageJson.version || '1.0.0',
      apiVersion: 'v1',
      buildDate: new Date().toISOString(),
      nodeVersion: process.version,
      environment: this.configService.get('NODE_ENV', 'development'),
    };
  }

  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}
