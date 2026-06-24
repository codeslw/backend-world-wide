import { Module } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';
import { RevalidationModule } from '../revalidation.module';

@Module({
  imports: [RevalidationModule],
  controllers: [MilestonesController],
  providers: [MilestonesService, PrismaService],
  exports: [MilestonesService],
})
export class MilestonesModule {}
