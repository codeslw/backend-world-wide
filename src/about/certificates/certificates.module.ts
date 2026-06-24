import { Module } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { DigitalOceanModule } from '../../digital-ocean/digital-ocean.module';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { RevalidationModule } from '../revalidation.module';

@Module({
  imports: [DigitalOceanModule, RevalidationModule],
  controllers: [CertificatesController],
  providers: [CertificatesService, PrismaService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
