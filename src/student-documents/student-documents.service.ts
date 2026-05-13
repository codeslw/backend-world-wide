import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateStudentDocumentDto } from './dto/create-student-document.dto';
import { EntityNotFoundException, ForbiddenActionException } from '../common/exceptions/app.exceptions';

@Injectable()
export class StudentDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(partnerId: string, dto: CreateStudentDocumentDto) {
    const student = await this.prisma.partnerStudent.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new EntityNotFoundException('StudentDocument', dto.studentId);
    if (student.partnerId !== partnerId) throw new ForbiddenActionException('Access denied');

    return this.prisma.studentDocument.create({ data: dto });
  }

  async findByStudent(partnerId: string, studentId: string) {
    const student = await this.prisma.partnerStudent.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new EntityNotFoundException('StudentDocument', studentId);
    if (student.partnerId !== partnerId) throw new ForbiddenActionException('Access denied');

    return this.prisma.studentDocument.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(partnerId: string, id: string) {
    const doc = await this.prisma.studentDocument.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!doc) throw new EntityNotFoundException('StudentDocument', id);
    if (doc.student.partnerId !== partnerId) throw new ForbiddenActionException('Access denied');

    return this.prisma.studentDocument.delete({ where: { id } });
  }
}
