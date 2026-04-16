import { Module } from '@nestjs/common';
import { PartnerStudentsService } from './partner-students.service';
import { PartnerStudentsController } from './partner-students.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [PartnerStudentsController],
  providers: [PartnerStudentsService, PrismaService],
})
export class PartnerStudentsModule {}
