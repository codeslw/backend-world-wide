import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { DigitalOceanModule } from '../digital-ocean/digital-ocean.module';
import { PrismaService } from '../db/prisma.service';

@Module({
  imports: [DigitalOceanModule, HttpModule],
  controllers: [FilesController],
  providers: [FilesService, PrismaService],
  exports: [FilesService],
})
export class FilesModule {}
