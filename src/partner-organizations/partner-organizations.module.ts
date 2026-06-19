import { Module } from '@nestjs/common';
import { PartnerOrganizationsService } from './partner-organizations.service';
import { PartnerOrganizationsController } from './partner-organizations.controller';
import { PrismaService } from '../db/prisma.service';
import { PartnerAuditModule } from '../partner-audit/partner-audit.module';

@Module({
  imports: [PartnerAuditModule],
  controllers: [PartnerOrganizationsController],
  providers: [PartnerOrganizationsService, PrismaService],
  exports: [PartnerOrganizationsService],
})
export class PartnerOrganizationsModule {}
