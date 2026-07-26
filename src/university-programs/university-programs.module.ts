import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { UniversityProgramsController } from './university-programs.controller';
import { UniversityProgramsService } from './university-programs.service';
import { UniversityProgramsRepository } from './university-programs.repository';
import { UniversityProgramsMapper } from './university-programs.mapper';

@Module({
  imports: [DbModule],
  controllers: [UniversityProgramsController],
  providers: [
    UniversityProgramsService,
    UniversityProgramsRepository,
    UniversityProgramsMapper,
  ],
  exports: [UniversityProgramsService],
})
export class UniversityProgramsModule {}
