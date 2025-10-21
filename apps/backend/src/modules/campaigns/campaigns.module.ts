import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignAutomationService } from './campaign-automation.service';
import { CampaignExecutionProcessor } from './campaign-execution.processor';
import { Campaign } from './entities/campaign.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Customer } from '../customers/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Campaign, Appointment, Customer]),
    BullModule.registerQueue({
      name: 'campaign-execution',
    }),
    EventEmitterModule,
    NotificationsModule,
  ],
  controllers: [CampaignsController],
  providers: [
    CampaignsService,
    CampaignAutomationService,
    CampaignExecutionProcessor,
  ],
  exports: [CampaignsService, CampaignAutomationService],
})
export class CampaignsModule {}
