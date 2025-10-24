import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/roles.decorator';
import { DatabaseService } from '../database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  @Public()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  @Public()
  async ready() {
    const dbOk = await this.databaseService.testConnection();
    return {
      status: dbOk ? 'ready' : 'not-ready',
      database: dbOk ? 'connected' : 'not-connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}