import { Module } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { DigitalOceanModule } from '../../digital-ocean/digital-ocean.module';
import { FoundersController } from './founders.controller';
import { FoundersService } from './founders.service';

@Module({
  imports: [DigitalOceanModule],
  controllers: [FoundersController],
  providers: [FoundersService, PrismaService],
  exports: [FoundersService],
})
export class FoundersModule {}
