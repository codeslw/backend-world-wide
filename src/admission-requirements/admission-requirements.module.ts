import { Module } from '@nestjs/common';
import { AdmissionRequirementsService } from './admission-requirements.service';
import { AdmissionRequirementsController } from './admission-requirements.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [AdmissionRequirementsController],
  providers: [AdmissionRequirementsService, PrismaService],
  exports: [AdmissionRequirementsService],
})
export class AdmissionRequirementsModule {}
