import { Module } from '@nestjs/common';
import { CatalogEventsRelay } from './catalog-events.relay';

@Module({
  providers: [CatalogEventsRelay],
})
export class CatalogEventsModule {}
