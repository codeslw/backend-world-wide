import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { ApplicationsRepository } from './applications.repository';
import { PrismaService } from '../db/prisma.service';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [ProfilesModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationsRepository, PrismaService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
