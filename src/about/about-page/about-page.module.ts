import { Module } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { DigitalOceanModule } from '../../digital-ocean/digital-ocean.module';
import { AboutPageController } from './about-page.controller';
import { AboutPageService } from './about-page.service';

@Module({
  imports: [DigitalOceanModule],
  controllers: [AboutPageController],
  providers: [AboutPageService, PrismaService],
  exports: [AboutPageService],
})
export class AboutPageModule {}
