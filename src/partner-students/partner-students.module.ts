import { Module } from '@nestjs/common';
import { PartnerStudentsService } from './partner-students.service';
import { PartnerStudentsController } from './partner-students.controller';
import { PrismaService } from '../db/prisma.service';
import { PartnerOrganizationsModule } from '../partner-organizations/partner-organizations.module';

@Module({
  imports: [PartnerOrganizationsModule],
  controllers: [PartnerStudentsController],
  providers: [PartnerStudentsService, PrismaService],
})
export class PartnerStudentsModule {}
