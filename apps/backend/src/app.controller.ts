import { Controller, Get, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AppService } from './app.service';
import { Public } from './common/decorators';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
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
        description: { type: 'string', example: 'Multi-tenant AI assistant engine' },
        environment: { type: 'string', example: 'development' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 12345 },
      },
    },
  })
  getAppInfo() {
    return this.appService.getAppInfo();
  }

  @Public()
  @Get('health')
  @Version('1')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number', example: 12345 },
        memory: {
          type: 'object',
          properties: {
            used: { type: 'number' },
            total: { type: 'number' },
          },
        },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }

  @Public()
  @Get('version')
  @Version('1')
  @ApiOperation({ summary: 'Get API version' })
  @ApiResponse({
    status: 200,
    description: 'API version retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        version: { type: 'string', example: '1.0.0' },
        apiVersion: { type: 'string', example: 'v1' },
        buildDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  getVersion() {
    return this.appService.getVersion();
  }
}