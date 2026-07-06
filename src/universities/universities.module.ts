import { Module } from '@nestjs/common';
import { UniversitiesService } from './universities.service';
import { UniversitiesController } from './universities.controller';
import { PrismaService } from '../db/prisma.service';
import { UniversitiesMapper } from './universities.mapper';
import { UniversitiesRepository } from './universities.repository';
import { IntakesModule } from '../intakes/intakes.module';

@Module({
  imports: [IntakesModule],
  controllers: [UniversitiesController],
  providers: [
    UniversitiesService,
    PrismaService,
    UniversitiesMapper,
    UniversitiesRepository,
  ],
  exports: [UniversitiesService],
})
export class UniversitiesModule {}
