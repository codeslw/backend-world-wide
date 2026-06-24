import { Module } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { DigitalOceanModule } from '../../digital-ocean/digital-ocean.module';
import { TeamMembersController } from './team-members.controller';
import { TeamMembersService } from './team-members.service';
import { RevalidationModule } from '../revalidation.module';

@Module({
  imports: [DigitalOceanModule, RevalidationModule],
  controllers: [TeamMembersController],
  providers: [TeamMembersService, PrismaService],
  exports: [TeamMembersService],
})
export class TeamMembersModule {}
