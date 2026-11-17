import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateStudentDocumentDto } from './dto/create-student-document.dto';
import {
  EntityNotFoundException,
  ForbiddenActionException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';

export interface Requester {
  userId: string;
  role: Role;
}

/**
 * Documents on a student's profile (passport, diplomas, test results), shared
 * by all of the student's applications. Partners reach the students of their
 * organization; admins reach all. edu-crm calls these endpoints on behalf of
 * its users (ServiceActorGuard).
 *
 * The storage key is stored, not a link: presigned links expire, so every
 * read resolves a stable public URL, also for rows saved with a link earlier.
 */
@Injectable()
export class StudentDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
  ) {}

  private readonly include = {
    uploadedBy: {
      select: {
        email: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    },
  };

  private toDto(doc: any) {
    const p = doc.uploadedBy?.profile;
    const name = p ? [p.firstName, p.lastName].filter(Boolean).join(' ').trim() : '';
    const { uploadedBy, ...rest } = doc;
    return {
      ...rest,
      url: this.files.toPublicUrl(doc.url) ?? doc.url,
      uploadedByName: name || uploadedBy?.email || null,
    };
  }

  private async student(partnerIds: string[] | undefined, studentId: string) {
    const student = await this.prisma.partnerStudent.findUnique({
      where: { id: studentId },
      select: { id: true, partnerId: true },
    });
    if (!student) throw new EntityNotFoundException('PartnerStudent', studentId);
    if (partnerIds && !partnerIds.includes(student.partnerId))
      throw new ForbiddenActionException('Access denied');
    return student;
  }

  async create(
    partnerIds: string[] | undefined,
    requester: Requester,
    dto: CreateStudentDocumentDto,
  ) {
    await this.student(partnerIds, dto.studentId);
    const name = dto.name?.trim();
    const type = dto.type?.trim();
    if (!name || !type || !dto.url?.trim()) {
      throw new InvalidDataException('studentId, type, name and url are required');
    }
    const doc = await this.prisma.studentDocument.create({
      data: {
        studentId: dto.studentId,
        type,
        name,
        url: this.files.toStorageKey(dto.url),
        fileSize: dto.fileSize ?? null,
        mimeType: dto.mimeType ?? null,
        uploadedById: requester.userId,
        uploadedByRole: requester.role,
      },
      include: this.include,
    });
    return this.toDto(doc);
  }

  async findByStudent(partnerIds: string[] | undefined, studentId: string) {
    await this.student(partnerIds, studentId);
    const docs = await this.prisma.studentDocument.findMany({
      where: { studentId },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => this.toDto(d));
  }

  async remove(partnerIds: string[] | undefined, id: string) {
    const doc = await this.prisma.studentDocument.findUnique({
      where: { id },
      include: { student: { select: { partnerId: true } } },
    });
    if (!doc) throw new EntityNotFoundException('StudentDocument', id);
    if (partnerIds && !partnerIds.includes(doc.student.partnerId))
      throw new ForbiddenActionException('Access denied');
    // What the admin team put on the profile stays.
    if (partnerIds && doc.uploadedByRole === Role.ADMIN) {
      throw new ForbiddenActionException(
        'Documents added by the admin team cannot be deleted',
      );
    }
    await this.prisma.studentDocument.delete({ where: { id } });
    try {
      await this.files.deleteFileByUrl(doc.url);
    } catch {
      // Best effort: the object may be gone already.
    }
    return { id };
  }
}
