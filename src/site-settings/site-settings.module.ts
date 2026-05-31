import { Module } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { FilesModule } from '../files/files.module';
import { DigitalOceanModule } from '../digital-ocean/digital-ocean.module';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';

@Module({
  imports: [FilesModule, DigitalOceanModule],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService, PrismaService],
  exports: [SiteSettingsService],
})
export class SiteSettingsModule {}
