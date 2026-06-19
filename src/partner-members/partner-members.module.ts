import { Module } from '@nestjs/common';
import { PartnerMembersController } from './partner-members.controller';
import { PartnerMembersService } from './partner-members.service';
import { PrismaService } from '../db/prisma.service';
import { PartnerAuditModule } from '../partner-audit/partner-audit.module';

@Module({
  imports: [PartnerAuditModule],
  controllers: [PartnerMembersController],
  providers: [PartnerMembersService, PrismaService],
})
export class PartnerMembersModule {}
