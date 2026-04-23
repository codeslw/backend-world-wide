import { Module } from '@nestjs/common';
import { ApplicationProcessController } from './application-process.controller';
import { ApplicationProcessService } from './application-process.service';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [ApplicationProcessController],
  providers: [ApplicationProcessService, PrismaService],
  exports: [ApplicationProcessService],
})
export class ApplicationProcessModule {}
