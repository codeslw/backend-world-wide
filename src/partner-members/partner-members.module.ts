import { Module } from '@nestjs/common';
import { PartnerMembersController } from './partner-members.controller';
import { PartnerMembersService } from './partner-members.service';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [PartnerMembersController],
  providers: [PartnerMembersService, PrismaService],
})
export class PartnerMembersModule {}
