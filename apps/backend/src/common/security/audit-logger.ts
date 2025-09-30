import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuditLogger {
  private readonly logger = new Logger(AuditLogger.name);

  logAction(userId: string, action: string, details?: any) {
    this.logger.log(`User ${userId} performed ${action}`, { details });
  }
}
