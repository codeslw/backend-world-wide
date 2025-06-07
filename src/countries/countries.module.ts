import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [CountriesController],
  providers: [CountriesService, PrismaService],
  exports: [CountriesService],
})
export class CountriesModule {}
