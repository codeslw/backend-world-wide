import { Module } from '@nestjs/common';
import { PartnerApplicationsController } from './partner-applications.controller';
import { PartnerApplicationsService } from './partner-applications.service';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [PartnerApplicationsController],
  providers: [PartnerApplicationsService, PrismaService],
  exports: [PartnerApplicationsService],
})
export class PartnerApplicationsModule {}
