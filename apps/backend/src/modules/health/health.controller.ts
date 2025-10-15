import { Controller, Get, SetMetadata } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from '../analytics/health.service';

@ApiTags('Health')
@Controller('health')
@SetMetadata('skipThrottle', true)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get application health status' })
  @ApiResponse({ status: 200, description: 'Health check successful' })
  getStatus() {
    return this.healthService.getStatus();
  }

  @Get('database')
  @ApiOperation({ summary: 'Get database health status' })
  @ApiResponse({ status: 200, description: 'Database health check successful' })
  async getDatabaseHealth() {
    return this.healthService.getDatabaseHealth();
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Get detailed health status' })
  @ApiResponse({ status: 200, description: 'Detailed health check successful' })
  async getDetailedHealth() {
    return this.healthService.getDetailedHealth();
  }
}
