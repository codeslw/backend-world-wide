import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { DigitalOceanModule } from '../digital-ocean/digital-ocean.module';
import { PrismaService } from '../db/prisma.service';

@Module({
  imports: [DigitalOceanModule],
  controllers: [FilesController],
  providers: [FilesService, PrismaService],
  exports: [FilesService]
})
export class FilesModule {}