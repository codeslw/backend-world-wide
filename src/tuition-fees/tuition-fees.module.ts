import { Module } from '@nestjs/common';
import { TuitionFeesService } from './tuition-fees.service';
import { TuitionFeesController } from './tuition-fees.controller';
import { PrismaService } from '../db/prisma.service';
import { FilterService } from '../common/filters/filter.service';

@Module({
  controllers: [TuitionFeesController],
  providers: [TuitionFeesService, PrismaService, FilterService],
  exports: [TuitionFeesService]
})
export class TuitionFeesModule {} 