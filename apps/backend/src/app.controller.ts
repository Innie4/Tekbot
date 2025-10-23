import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      pid: process.pid,
      nodeVersion: process.version,
    };
  }

  @Get('version')
  @Public()
  getVersion() {
    return {
      version: '1.0.0',
      name: 'TekBot Platform API',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}