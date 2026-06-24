import { Module } from '@nestjs/common';
import { ApplicationDocumentsService } from './application-documents.service';
import { ApplicationDocumentsController } from './application-documents.controller';
import { PrismaService } from '../db/prisma.service';
import { FilesModule } from '../files/files.module';
import { PartnerOrganizationsModule } from '../partner-organizations/partner-organizations.module';

@Module({
  imports: [FilesModule, PartnerOrganizationsModule],
  controllers: [ApplicationDocumentsController],
  providers: [ApplicationDocumentsService, PrismaService],
  exports: [ApplicationDocumentsService],
})
export class ApplicationDocumentsModule {}
