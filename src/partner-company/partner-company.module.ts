import { Module } from '@nestjs/common';
import { PartnerCompanyController } from './partner-company.controller';
import { PartnerCompanyService } from './partner-company.service';
import { PrismaService } from '../db/prisma.service';
import { DigitalOceanModule } from '../digital-ocean/digital-ocean.module';

@Module({
  imports: [DigitalOceanModule],
  controllers: [PartnerCompanyController],
  providers: [PartnerCompanyService, PrismaService],
})
export class PartnerCompanyModule {}
