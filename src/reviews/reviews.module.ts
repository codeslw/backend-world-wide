import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../db/prisma.service';
import { DigitalOceanModule } from '../digital-ocean/digital-ocean.module';

@Module({
  imports: [DigitalOceanModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, PrismaService],
})
export class ReviewsModule {}
