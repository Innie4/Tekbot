import { Controller, Get, Version } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/roles.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'Get application information' })
  @ApiResponse({
    status: 200,
    description: 'Application information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'TekBot Platform API' },
        version: { type: 'string', example: '1.0.0' },
        description: {
          type: 'string',
          example: 'Multi-tenant AI assistant engine',
        },
        environment: { type: 'string', example: 'development' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 12345 },
      },
    },
  })
  getAppInfo() {
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
