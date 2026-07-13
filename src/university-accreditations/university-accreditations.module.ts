import { Module } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { DigitalOceanModule } from '../digital-ocean/digital-ocean.module';
import { UniversityAccreditationsController } from './university-accreditations.controller';
import { UniversityAccreditationsService } from './university-accreditations.service';

@Module({
  imports: [DigitalOceanModule],
  controllers: [UniversityAccreditationsController],
  providers: [UniversityAccreditationsService, PrismaService],
  exports: [UniversityAccreditationsService],
})
export class UniversityAccreditationsModule {}
