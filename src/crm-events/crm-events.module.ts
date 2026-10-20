import { Module } from '@nestjs/common';
import { CrmEventsConsumer } from './crm-events.consumer';
import { PartnerTelegramController } from './partner-telegram.controller';

@Module({
  controllers: [PartnerTelegramController],
  providers: [CrmEventsConsumer],
})
export class CrmEventsModule {}
