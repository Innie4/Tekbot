import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WidgetConfigController } from './widget-config.controller';
import { WidgetConfigService } from './widget-config.service';
import { WidgetConfig } from './entities/widget-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WidgetConfig])],
  controllers: [WidgetConfigController],
  providers: [WidgetConfigService],
  exports: [WidgetConfigService],
})
export class WidgetConfigModule {}