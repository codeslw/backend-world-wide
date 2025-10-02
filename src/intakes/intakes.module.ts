import { Module } from '@nestjs/common';
import { IntakesService } from './intakes.service';
import { IntakesController } from './intakes.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [IntakesController],
  providers: [IntakesService, PrismaService],
})
export class IntakesModule {}
