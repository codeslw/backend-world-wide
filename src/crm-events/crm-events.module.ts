import { Module } from '@nestjs/common';
import { CrmEventsConsumer } from './crm-events.consumer';
import { CrmStudentsApplier } from './crm-students.applier';

@Module({
  providers: [CrmStudentsApplier, CrmEventsConsumer],
})
export class CrmEventsModule {}
