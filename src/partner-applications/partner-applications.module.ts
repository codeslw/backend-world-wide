import { Module } from '@nestjs/common';
import { PartnerApplicationsController } from './partner-applications.controller';
import { PartnerApplicationsService } from './partner-applications.service';
import { PrismaService } from '../db/prisma.service';
import { PartnerOrganizationsModule } from '../partner-organizations/partner-organizations.module';

@Module({
  imports: [PartnerOrganizationsModule],
  controllers: [PartnerApplicationsController],
  providers: [PartnerApplicationsService, PrismaService],
  exports: [PartnerApplicationsService],
})
export class PartnerApplicationsModule {}
