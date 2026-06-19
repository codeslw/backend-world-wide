import { Module } from '@nestjs/common';
import { PartnerAuditService } from './partner-audit.service';
import { PartnerAuditController } from './partner-audit.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [PartnerAuditController],
  providers: [PartnerAuditService, PrismaService],
  exports: [PartnerAuditService],
})
export class PartnerAuditModule {}
