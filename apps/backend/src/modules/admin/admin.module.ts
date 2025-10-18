import { Module } from '@nestjs/common';
import { TenantsModule } from '../tenants/tenants.module';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TenantsModule],
  controllers: [SettingsController],
  providers: [],
  exports: [],
})
export class AdminModule {}