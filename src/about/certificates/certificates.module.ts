import { Module } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { DigitalOceanModule } from '../../digital-ocean/digital-ocean.module';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';

@Module({
  imports: [DigitalOceanModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, PrismaService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
