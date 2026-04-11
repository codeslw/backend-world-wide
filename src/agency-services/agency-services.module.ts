import { Module } from '@nestjs/common';
import { AgencyServicesService } from './agency-services.service';
import { AgencyServicesController } from './agency-services.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [AgencyServicesController],
  providers: [AgencyServicesService, PrismaService],
  exports: [AgencyServicesService],
})
export class AgencyServicesModule {}
