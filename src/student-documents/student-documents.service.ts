import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateStudentDocumentDto } from './dto/create-student-document.dto';
import {
  EntityNotFoundException,
  ForbiddenActionException,
} from '../common/exceptions/app.exceptions';

@Injectable()
export class StudentDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    partnerIds: string[] | undefined,
    dto: CreateStudentDocumentDto,
  ) {
    const student = await this.prisma.partnerStudent.findUnique({
      where: { id: dto.studentId },
    });
    if (!student)
      throw new EntityNotFoundException('StudentDocument', dto.studentId);
    if (partnerIds && !partnerIds.includes(student.partnerId))
      throw new ForbiddenActionException('Access denied');

    return this.prisma.studentDocument.create({ data: dto });
  }

  async findByStudent(partnerIds: string[] | undefined, studentId: string) {
    const student = await this.prisma.partnerStudent.findUnique({
      where: { id: studentId },
    });
    if (!student)
      throw new EntityNotFoundException('StudentDocument', studentId);
    if (partnerIds && !partnerIds.includes(student.partnerId))
      throw new ForbiddenActionException('Access denied');

    return this.prisma.studentDocument.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(partnerIds: string[] | undefined, id: string) {
    const doc = await this.prisma.studentDocument.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!doc) throw new EntityNotFoundException('StudentDocument', id);
    if (partnerIds && !partnerIds.includes(doc.student.partnerId))
      throw new ForbiddenActionException('Access denied');

    return this.prisma.studentDocument.delete({ where: { id } });
  }
}
