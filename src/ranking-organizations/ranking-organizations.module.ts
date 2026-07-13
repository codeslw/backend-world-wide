import { Module } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { DigitalOceanModule } from '../digital-ocean/digital-ocean.module';
import { RankingOrganizationsController } from './ranking-organizations.controller';
import { RankingOrganizationsService } from './ranking-organizations.service';

@Module({
  imports: [DigitalOceanModule],
  controllers: [RankingOrganizationsController],
  providers: [RankingOrganizationsService, PrismaService],
  exports: [RankingOrganizationsService],
})
export class RankingOrganizationsModule {}
