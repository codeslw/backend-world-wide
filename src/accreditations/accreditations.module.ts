import { Module } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { DigitalOceanModule } from '../digital-ocean/digital-ocean.module';
import { AccreditationsController } from './accreditations.controller';
import { AccreditationsService } from './accreditations.service';

@Module({
  imports: [DigitalOceanModule],
  controllers: [AccreditationsController],
  providers: [AccreditationsService, PrismaService],
  exports: [AccreditationsService],
})
export class AccreditationsModule {}
