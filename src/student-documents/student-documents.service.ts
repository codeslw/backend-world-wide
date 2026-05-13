import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateStudentDocumentDto } from './dto/create-student-document.dto';

@Injectable()
export class StudentDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(partnerId: string, dto: CreateStudentDocumentDto) {
    const student = await this.prisma.partnerStudent.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.partnerId !== partnerId) throw new ForbiddenException('Access denied');

    return this.prisma.studentDocument.create({ data: dto });
  }

  async findByStudent(partnerId: string, studentId: string) {
    const student = await this.prisma.partnerStudent.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');
    if (student.partnerId !== partnerId) throw new ForbiddenException('Access denied');

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
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.student.partnerId !== partnerId) throw new ForbiddenException('Access denied');

    return this.prisma.studentDocument.delete({ where: { id } });
  }
}
