import { Module } from '@nestjs/common';
import { PartnerCompanyController } from './partner-company.controller';
import { PartnerCompanyService } from './partner-company.service';
import { PrismaService } from '../db/prisma.service';
import { DigitalOceanModule } from '../digital-ocean/digital-ocean.module';
import { PartnerAuditModule } from '../partner-audit/partner-audit.module';

@Module({
  imports: [DigitalOceanModule, PartnerAuditModule],
  controllers: [PartnerCompanyController],
  providers: [PartnerCompanyService, PrismaService],
})
export class PartnerCompanyModule {}
