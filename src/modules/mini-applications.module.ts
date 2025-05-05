import { Module } from '@nestjs/common';
import { MiniApplicationsController } from './mini-applications.controller';
import { MiniApplicationsService } from './mini-applications.service';
import { PrismaService } from '../db/prisma.service';

@Module({
  imports: [],
  controllers: [MiniApplicationsController],
  providers: [MiniApplicationsService, PrismaService]
})
export class MiniApplicationsModule {}
