import { Module } from '@nestjs/common';
import { PartnerApplicationsController } from './partner-applications.controller';
import { PartnerApplicationsService } from './partner-applications.service';
import { PrismaService } from '../db/prisma.service';
import { PartnerOrganizationsModule } from '../partner-organizations/partner-organizations.module';
import { PartnerAuditModule } from '../partner-audit/partner-audit.module';

@Module({
  imports: [PartnerOrganizationsModule, PartnerAuditModule],
  controllers: [PartnerApplicationsController],
  providers: [PartnerApplicationsService, PrismaService],
  exports: [PartnerApplicationsService],
})
export class PartnerApplicationsModule {}
