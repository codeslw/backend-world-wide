import { Module } from '@nestjs/common';
import { StudentDocumentsService } from './student-documents.service';
import { StudentDocumentsController } from './student-documents.controller';
import { PrismaService } from '../db/prisma.service';

@Module({
  controllers: [StudentDocumentsController],
  providers: [StudentDocumentsService, PrismaService],
})
export class StudentDocumentsModule {}
