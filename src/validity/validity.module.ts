import { Module } from '@nestjs/common';
import { ValidityService } from './validity.service';
import { ValidityController } from './validity.controller';
import { ProfilesModule } from '../profiles/profiles.module';
import { UniversitiesModule } from '../universities/universities.module';
import { PrismaService } from '../db/prisma.service';

@Module({
  imports: [ProfilesModule, UniversitiesModule],
  controllers: [ValidityController],
  providers: [ValidityService, PrismaService],
})
export class ValidityModule {}
