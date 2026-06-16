import { Module } from '@nestjs/common';
import { PartnerOrganizationsService } from './partner-organizations.service';
import { PartnerOrganizationsController } from './partner-organizations.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [PartnerOrganizationsController],
  providers: [PartnerOrganizationsService, PrismaService],
  exports: [PartnerOrganizationsService],
})
export class PartnerOrganizationsModule {}
