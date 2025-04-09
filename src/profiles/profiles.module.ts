import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesRepository } from './profiles.repository';
import { PrismaService } from '../db/prisma.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesRepository, PrismaService],
  exports: [ProfilesService],
})
export class ProfilesModule {} 