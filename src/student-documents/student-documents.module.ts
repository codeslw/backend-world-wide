import { Module } from '@nestjs/common';
import { StudentDocumentsService } from './student-documents.service';
import { StudentDocumentsController } from './student-documents.controller';
import { PrismaService } from '../db/prisma.service';
import { PartnerOrganizationsModule } from '../partner-organizations/partner-organizations.module';
import { PartnerAuditModule } from '../partner-audit/partner-audit.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [PartnerOrganizationsModule, PartnerAuditModule, FilesModule],
  controllers: [StudentDocumentsController],
  providers: [StudentDocumentsService, PrismaService],
})
export class StudentDocumentsModule {}
