import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  getStatus() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseHealth() {
    const isConnected = await this.databaseService.testConnection();
    const connectionInfo = await this.databaseService.getConnectionInfo();
    
    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      database: connectionInfo,
      timestamp: new Date().toISOString(),
    };
  }

  async getDetailedHealth() {
    const basicHealth = this.getStatus();
    const databaseHealth = await this.getDatabaseHealth();
    
    return {
      ...basicHealth,
      database: databaseHealth,
      services: {
        database: databaseHealth.status,
      },
    };
  }
}
