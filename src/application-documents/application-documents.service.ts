import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateApplicationDocumentDto } from './dto/create-application-document.dto';
import { UpdateApplicationDocumentStatusDto } from './dto/update-application-document-status.dto';
import { ApplicationDocumentResponseDto } from './dto/application-document-response.dto';
import {
  ApplicationRequirementsResponseDto,
  RequirementItemDto,
} from './dto/application-requirements-response.dto';
import {
  EntityNotFoundException,
  ForbiddenActionException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';
import {
  ApplicationDocumentStatus,
  Prisma,
  Role,
} from '@prisma/client';

export type ApplicationRef =
  | { type: 'partner'; id: string }
  | { type: 'user'; id: string };

export interface Requester {
  userId: string;
  role: Role;
}

@Injectable()
export class ApplicationDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly partnerOrgs: PartnerOrganizationsService,
  ) {}

  // ── Access control ──────────────────────────────────────────────────────────

  /**
   * Verify the requester may read/write documents for the given application.
   * Admins always pass. Partners must own the partner application (within their
   * org's visible partner ids). Clients must own the user application.
   * Returns the resolved owning ref so callers can persist the correct FK.
   */
  private async assertAccess(
    requester: Requester,
    ref: ApplicationRef,
  ): Promise<void> {
    if (requester.role === Role.ADMIN) {
      // Still confirm the application exists so we return 404 not a silent ok.
      await this.loadApplicationOwner(ref);
      return;
    }

    if (ref.type === 'partner') {
      if (requester.role !== Role.PARTNER) {
        throw new ForbiddenActionException('Access denied');
      }
      const app = await this.prisma.partnerApplication.findUnique({
        where: { id: ref.id },
        select: { partnerId: true },
      });
      if (!app) throw new EntityNotFoundException('PartnerApplication', ref.id);
      const visible = await this.partnerOrgs.resolveVisiblePartnerIds(
        requester.userId,
      );
      if (!visible.includes(app.partnerId)) {
        throw new ForbiddenActionException('Access denied');
      }
      return;
    }

    // user-submitted application
    if (requester.role !== Role.CLIENT) {
      throw new ForbiddenActionException('Access denied');
    }
    const app = await this.prisma.application.findUnique({
      where: { id: ref.id },
      select: { profile: { select: { userId: true } } },
    });
    if (!app) throw new EntityNotFoundException('Application', ref.id);
    if (app.profile?.userId !== requester.userId) {
      throw new ForbiddenActionException('Access denied');
    }
  }

  private async loadApplicationOwner(ref: ApplicationRef): Promise<void> {
    if (ref.type === 'partner') {
      const app = await this.prisma.partnerApplication.findUnique({
        where: { id: ref.id },
        select: { id: true },
      });
      if (!app) throw new EntityNotFoundException('PartnerApplication', ref.id);
    } else {
      const app = await this.prisma.application.findUnique({
        where: { id: ref.id },
        select: { id: true },
      });
      if (!app) throw new EntityNotFoundException('Application', ref.id);
    }
  }

  private refFromDto(dto: CreateApplicationDocumentDto): ApplicationRef {
    if (dto.partnerApplicationId && dto.applicationId) {
      throw new InvalidDataException(
        'Provide exactly one of partnerApplicationId or applicationId',
      );
    }
    if (dto.partnerApplicationId) {
      return { type: 'partner', id: dto.partnerApplicationId };
    }
    if (dto.applicationId) {
      return { type: 'user', id: dto.applicationId };
    }
    throw new InvalidDataException(
      'partnerApplicationId or applicationId is required',
    );
  }

  // ── Mapping ────────────────────────────────────────────────────────────────

  private readonly include = {
    documentType: { select: { name: true } },
    uploadedBy: {
      select: { id: true, email: true, profile: true },
    },
  } satisfies Prisma.ApplicationDocumentInclude;

  private mapToDto(doc: any): ApplicationDocumentResponseDto {
    const profile = doc.uploadedBy?.profile;
    const uploadedByName = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
        doc.uploadedBy?.email
      : doc.uploadedBy?.email || null;

    return {
      id: doc.id,
      partnerApplicationId: doc.partnerApplicationId,
      applicationId: doc.applicationId,
      documentTypeId: doc.documentTypeId,
      documentTypeName: doc.documentType?.name ?? null,
      name: doc.name,
      fileUrl: this.files.toPublicUrl(doc.fileUrl) ?? doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      kind: doc.kind,
      status: doc.status,
      reviewNote: doc.reviewNote,
      uploadedById: doc.uploadedById,
      uploadedByRole: doc.uploadedByRole,
      uploadedByName,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async create(
    requester: Requester,
    dto: CreateApplicationDocumentDto,
  ): Promise<ApplicationDocumentResponseDto> {
    const ref = this.refFromDto(dto);
    await this.assertAccess(requester, ref);

    // Persist the storage key (not a resolved URL), consistent with chat files.
    const fileKey = this.files.toStorageKey(dto.fileUrl);

    const doc = await this.prisma.applicationDocument.create({
      data: {
        ...(ref.type === 'partner'
          ? { partnerApplication: { connect: { id: ref.id } } }
          : { application: { connect: { id: ref.id } } }),
        ...(dto.documentTypeId && {
          documentType: { connect: { id: dto.documentTypeId } },
        }),
        name: dto.name,
        fileUrl: fileKey,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        kind: dto.kind ?? 'OTHER',
        status: dto.status ?? ApplicationDocumentStatus.PENDING,
        uploadedBy: { connect: { id: requester.userId } },
        uploadedByRole: requester.role,
      },
      include: this.include,
    });

    return this.mapToDto(doc);
  }

  async findForApplication(
    requester: Requester,
    ref: ApplicationRef,
  ): Promise<ApplicationDocumentResponseDto[]> {
    await this.assertAccess(requester, ref);
    const docs = await this.prisma.applicationDocument.findMany({
      where:
        ref.type === 'partner'
          ? { partnerApplicationId: ref.id }
          : { applicationId: ref.id },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => this.mapToDto(d));
  }

  async updateStatus(
    requester: Requester,
    id: string,
    dto: UpdateApplicationDocumentStatusDto,
  ): Promise<ApplicationDocumentResponseDto> {
    const existing = await this.prisma.applicationDocument.findUnique({
      where: { id },
      select: { id: true, partnerApplicationId: true, applicationId: true },
    });
    if (!existing) throw new EntityNotFoundException('ApplicationDocument', id);

    const ref: ApplicationRef = existing.partnerApplicationId
      ? { type: 'partner', id: existing.partnerApplicationId }
      : { type: 'user', id: existing.applicationId! };
    await this.assertAccess(requester, ref);

    const updated = await this.prisma.applicationDocument.update({
      where: { id },
      data: { status: dto.status, reviewNote: dto.reviewNote },
      include: this.include,
    });
    return this.mapToDto(updated);
  }

  async remove(requester: Requester, id: string): Promise<{ id: string }> {
    const existing = await this.prisma.applicationDocument.findUnique({
      where: { id },
      select: {
        id: true,
        fileUrl: true,
        partnerApplicationId: true,
        applicationId: true,
      },
    });
    if (!existing) throw new EntityNotFoundException('ApplicationDocument', id);

    const ref: ApplicationRef = existing.partnerApplicationId
      ? { type: 'partner', id: existing.partnerApplicationId }
      : { type: 'user', id: existing.applicationId! };
    await this.assertAccess(requester, ref);

    await this.prisma.applicationDocument.delete({ where: { id } });

    // Best-effort storage cleanup; do not fail the request if it errors.
    try {
      await this.files.deleteFileByUrl(existing.fileUrl);
    } catch {
      // Object may already be gone, or be shared; ignore.
    }

    return { id };
  }

  // ── Requirements checklist ───────────────────────────────────────────────────

  /**
   * Resolve the ApplyBoard-style requirements checklist for an application:
   * the program's process template (or default) cross-referenced with the
   * documents already uploaded against this application.
   */
  async getRequirements(
    requester: Requester,
    ref: ApplicationRef,
  ): Promise<ApplicationRequirementsResponseDto> {
    await this.assertAccess(requester, ref);

    // Resolve the program for this application.
    const programId = await this.resolveProgramId(ref);

    const template = programId
      ? await this.resolveTemplateForProgram(programId)
      : await this.resolveDefaultTemplate();

    const docs = await this.prisma.applicationDocument.findMany({
      where:
        ref.type === 'partner'
          ? { partnerApplicationId: ref.id }
          : { applicationId: ref.id },
      include: this.include,
      orderBy: { createdAt: 'desc' },
    });

    const docsByType = new Map<string, any[]>();
    const otherDocs: any[] = [];
    for (const doc of docs) {
      if (doc.documentTypeId) {
        const list = docsByType.get(doc.documentTypeId) ?? [];
        list.push(doc);
        docsByType.set(doc.documentTypeId, list);
      } else {
        otherDocs.push(doc);
      }
    }

    const steps = (template?.steps ?? []).map((step: any) => ({
      stepId: step.id,
      name: step.name,
      description: step.description,
      order: step.order,
      statusKey: step.statusKey,
      requirements: (step.requiredDocuments ?? []).map((dt: any) =>
        this.buildRequirementItem(dt, docsByType.get(dt.id) ?? []),
      ),
    }));

    return {
      templateId: template?.id ?? null,
      templateName: template?.name ?? null,
      steps,
      otherDocuments: otherDocs.map((d) => this.mapToDto(d)),
    };
  }

  private buildRequirementItem(
    documentType: any,
    docs: any[],
  ): RequirementItemDto {
    let status: RequirementItemDto['status'];
    if (!docs.length) {
      status = 'MISSING';
    } else if (docs.some((d) => d.status === ApplicationDocumentStatus.APPROVED)) {
      status = 'APPROVED';
    } else if (
      docs.every((d) => d.status === ApplicationDocumentStatus.REJECTED)
    ) {
      status = 'REJECTED';
    } else if (
      docs.some((d) => d.status === ApplicationDocumentStatus.IN_REVIEW)
    ) {
      status = 'IN_REVIEW';
    } else {
      status = 'PENDING';
    }

    return {
      documentTypeId: documentType.id,
      name: documentType.name,
      description: documentType.description,
      required: documentType.required,
      fileTypes: documentType.fileTypes ?? [],
      maxSizeMb: documentType.maxSizeMb,
      status,
      documents: docs.map((d) => this.mapToDto(d)),
    };
  }

  private async resolveProgramId(ref: ApplicationRef): Promise<string | null> {
    if (ref.type === 'partner') {
      const app = await this.prisma.partnerApplication.findUnique({
        where: { id: ref.id },
        select: { programId: true },
      });
      return app?.programId ?? null;
    }
    const app = await this.prisma.application.findUnique({
      where: { id: ref.id },
      select: { preferredProgram: true },
    });
    return app?.preferredProgram ?? null;
  }

  private async resolveTemplateForProgram(programId: string) {
    const specific = await this.prisma.applicationProcessTemplate.findUnique({
      where: { programId },
      include: {
        steps: {
          include: { requiredDocuments: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (specific) return specific;
    return this.resolveDefaultTemplate();
  }

  private resolveDefaultTemplate() {
    return this.prisma.applicationProcessTemplate.findFirst({
      where: { isDefault: true },
      include: {
        steps: {
          include: { requiredDocuments: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }
}
