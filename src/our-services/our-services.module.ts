import { Module } from '@nestjs/common';
import { OurServicesController } from './our-services.controller';
import { OurServicesService } from './our-services.service';
import { DbModule } from '../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [OurServicesController],
  providers: [OurServicesService],
  exports: [OurServicesService],
})
export class OurServicesModule {}
