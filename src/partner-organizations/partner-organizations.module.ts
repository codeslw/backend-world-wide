import { Module } from '@nestjs/common';
import { PartnerOrganizationsService } from './partner-organizations.service';
import { PrismaService } from '../db/prisma.service';

@Module({
  providers: [PartnerOrganizationsService, PrismaService],
  exports: [PartnerOrganizationsService],
})
export class PartnerOrganizationsModule {}
