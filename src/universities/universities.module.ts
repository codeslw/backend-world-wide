import { Module } from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { UniversitiesController } from './universities.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [UniversitiesController],
  providers: [UniversitiesService, PrismaService],
  exports: [UniversitiesService]
})
export class UniversitiesModule {} 