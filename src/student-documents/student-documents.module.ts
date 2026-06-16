import { Module } from '@nestjs/common';
import { StudentDocumentsService } from './student-documents.service';
import { StudentDocumentsController } from './student-documents.controller';
import { PrismaService } from '../db/prisma.service';
import { PartnerOrganizationsModule } from '../partner-organizations/partner-organizations.module';

@Module({
  imports: [PartnerOrganizationsModule],
  controllers: [StudentDocumentsController],
  providers: [StudentDocumentsService, PrismaService],
})
export class StudentDocumentsModule {}
