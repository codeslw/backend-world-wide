import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateApplicationDocumentDto } from './dto/create-application-document.dto';
import { UpdateApplicationDocumentStatusDto } from './dto/update-application-document-status.dto';
import { ApplicationDocumentResponseDto } from './dto/application-document-response.dto';
import {
  ApplicationRequirementsResponseDto,
  ProfileFileDto,
  RequirementItemDto,
} from './dto/application-requirements-response.dto';
import { CreateDocumentFromProfileDto } from './dto/create-document-from-profile.dto';
import {
  EntityNotFoundException,
  ForbiddenActionException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';
import { PartnerOrganizationsService } from '../partner-organizations/partner-organizations.service';
import {
  ApplicationDocumentStatus,
  DocumentRequirementKind,
  Prisma,
  Role,
} from '@prisma/client';
import { StudentActor } from '../auth/guards/service-actor.guard';
import {
  ChecklistItem,
  PROGRAM_FILE_TYPES,
  PROGRAM_MAX_SIZE_MB,
  ProfileFile,
} from '../admissions/checklist';
import {
  ApplicationRef,
  loadChecklist,
  LoadedDocument,
} from '../admissions/load-checklist';
import { DOCUMENT_KIND_LABELS, isDocumentKind } from '../admissions/document-kinds';

export { ApplicationRef };

/** Kinds only the admin side uploads. */
const ADMIN_ONLY_KINDS = new Set<string>(['OFFER_LETTER', 'ADMIN_DOC']);

export interface Requester {
  /** Null for a student acting through their personal link. */
  userId: string | null;
  role: Role;
  student?: StudentActor;
}

/** What an upload fulfils: a template document type, a kind the program asks for, or nothing. */
interface Target {
  documentTypeId: string | null;
  requirementKind: DocumentRequirementKind | null;
  name: string | null;
  fileTypes: string[];
  maxSizeMb: number;
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
    if (requester.student) {
      await this.assertStudentAccess(requester.student, ref);
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

  /** A student reaches their own applications only. */
  private async assertStudentAccess(
    student: StudentActor,
    ref: ApplicationRef,
  ): Promise<void> {
    if (ref.type === 'partner') {
      const app = await this.prisma.partnerApplication.findUnique({
        where: { id: ref.id },
        select: { partnerStudentId: true },
      });
      if (!app) throw new EntityNotFoundException('PartnerApplication', ref.id);
      if (student.kind === 'partner' && app.partnerStudentId === student.id) return;
    } else {
      const app = await this.prisma.application.findUnique({
        where: { id: ref.id },
        select: { profile: { select: { userId: true } } },
      });
      if (!app) throw new EntityNotFoundException('Application', ref.id);
      if (student.kind === 'client' && app.profile?.userId === student.id) return;
    }
    throw new ForbiddenActionException('Access denied');
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

  private refFromDto(dto: {
    partnerApplicationId?: string;
    applicationId?: string;
  }): ApplicationRef {
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
    const accountName = profile
      ? [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
        doc.uploadedBy?.email
      : doc.uploadedBy?.email || null;

    return {
      id: doc.id,
      partnerApplicationId: doc.partnerApplicationId,
      applicationId: doc.applicationId,
      documentTypeId: doc.documentTypeId,
      documentTypeName: doc.documentType?.name ?? null,
      requirementKind: doc.requirementKind ?? null,
      name: doc.name,
      fileUrl: this.files.toPublicUrl(doc.fileUrl) ?? doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      kind: doc.kind,
      status: doc.status,
      reviewNote: doc.reviewNote,
      comment: doc.comment,
      expiresAt: doc.expiresAt ?? null,
      uploadedById: doc.uploadedById,
      uploadedByRole: doc.uploadedByRole,
      uploadedByName: accountName ?? doc.uploadedByName ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private mapProfileFile(file: ProfileFile): ProfileFileDto {
    return {
      id: file.id,
      source: file.source,
      kind: file.kind,
      type: file.type,
      name: file.name,
      fileUrl: this.files.toPublicUrl(file.url) ?? file.url,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      expiresAt: file.expiresAt,
      createdAt: file.createdAt,
    };
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async create(
    requester: Requester,
    dto: CreateApplicationDocumentDto,
  ): Promise<ApplicationDocumentResponseDto> {
    const ref = this.refFromDto(dto);
    await this.assertAccess(requester, ref);

    const isAdmin = requester.role === Role.ADMIN;
    // Only reviewers decide a document's status, and offer letters and admin
    // documents come from the admin side only.
    if (!isAdmin && dto.status && dto.status !== ApplicationDocumentStatus.PENDING) {
      throw new ForbiddenActionException(
        'Only an admin can set the review status of a document',
      );
    }
    if (!isAdmin && dto.kind && ADMIN_ONLY_KINDS.has(dto.kind)) {
      throw new ForbiddenActionException(
        `Only an admin can upload a ${dto.kind} document`,
      );
    }
    const target = await this.resolveTarget(dto.documentTypeId);
    // The requirement's own limits; admins may attach anything.
    if (target && !isAdmin) {
      if (dto.fileSize && target.maxSizeMb > 0 && dto.fileSize > target.maxSizeMb * 1024 * 1024) {
        throw new InvalidDataException(
          `"${target.name}" accepts files up to ${target.maxSizeMb} MB`,
        );
      }
      if (!matchesFileTypes(target.fileTypes, dto.name, dto.mimeType)) {
        throw new InvalidDataException(
          `"${target.name}" accepts ${target.fileTypes.join(', ')} files`,
        );
      }
    }
    const name = dto.name?.trim();
    if (!name) throw new InvalidDataException('Document name is required');
    if (!dto.fileUrl?.trim()) {
      throw new InvalidDataException('fileUrl is required');
    }

    const doc = await this.prisma.applicationDocument.create({
      data: {
        ...this.ownerOf(ref),
        ...this.fulfils(target),
        name,
        // Persist the storage key (not a resolved URL), consistent with chat files.
        fileUrl: this.files.toStorageKey(dto.fileUrl),
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        kind: dto.kind ?? (target ? 'REQUIREMENT' : 'OTHER'),
        status: isAdmin
          ? (dto.status ?? ApplicationDocumentStatus.PENDING)
          : ApplicationDocumentStatus.PENDING,
        comment: dto.comment ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        ...this.uploader(requester),
      },
      include: this.include,
    });

    return this.mapToDto(doc);
  }

  private ownerOf(ref: ApplicationRef) {
    return ref.type === 'partner'
      ? { partnerApplication: { connect: { id: ref.id } } }
      : { application: { connect: { id: ref.id } } };
  }

  private fulfils(target: Target | null) {
    if (!target) return {};
    return target.documentTypeId
      ? { documentType: { connect: { id: target.documentTypeId } } }
      : { requirementKind: target.requirementKind };
  }

  private uploader(requester: Requester) {
    return {
      ...(requester.userId && {
        uploadedBy: { connect: { id: requester.userId } },
      }),
      uploadedByRole: requester.role,
      ...(requester.student && { uploadedByName: requester.student.name }),
    };
  }

  /**
   * What `documentTypeId` names: a document type of the process template, or
   * `kind:<KIND>` for a document the program itself asks for.
   */
  private async resolveTarget(
    key: string | null | undefined,
  ): Promise<Target | null> {
    if (!key) return null;
    if (key.startsWith('kind:')) {
      const kind = key.slice('kind:'.length);
      if (!isDocumentKind(kind)) {
        throw new InvalidDataException(`Unknown document kind ${kind}`);
      }
      return {
        documentTypeId: null,
        requirementKind: kind,
        name: DOCUMENT_KIND_LABELS[kind].en,
        fileTypes: PROGRAM_FILE_TYPES,
        maxSizeMb: PROGRAM_MAX_SIZE_MB,
      };
    }
    const type = await this.prisma.applicationDocumentType.findUnique({
      where: { id: key },
      select: { id: true, name: true, fileTypes: true, maxSizeMb: true, kind: true },
    });
    if (!type) {
      throw new InvalidDataException(`Document type ${key} does not exist`);
    }
    return {
      documentTypeId: type.id,
      requirementKind: type.kind,
      name: type.name,
      fileTypes: type.fileTypes,
      maxSizeMb: type.maxSizeMb,
    };
  }

  /**
   * Puts a file from the applicant's profile on the application, for one of its
   * requirements (admins; used when reviewing a requirement the profile
   * answers). The file itself is shared, not copied.
   */
  async createFromProfile(
    requester: Requester,
    dto: CreateDocumentFromProfileDto,
  ): Promise<ApplicationDocumentResponseDto> {
    if (requester.role !== Role.ADMIN) {
      throw new ForbiddenActionException('Only an admin can attach a profile file');
    }
    const ref = this.refFromDto(dto);
    const loaded = await loadChecklist(this.prisma, ref);
    if (!loaded) throw new EntityNotFoundException('Application', ref.id);
    const item = loaded.checklist.steps
      .flatMap((s) => s.requirements)
      .find((r) => r.key === dto.documentTypeId);
    if (!item) {
      throw new InvalidDataException('This requirement is not on the checklist');
    }
    const file = item.profileFiles.find((f) => f.id === dto.profileFileId);
    if (!file) {
      throw new InvalidDataException('This file is not on the profile');
    }
    const doc = await this.prisma.applicationDocument.create({
      data: {
        ...this.ownerOf(ref),
        ...(item.documentTypeId
          ? { documentType: { connect: { id: item.documentTypeId } } }
          : { requirementKind: item.kind }),
        name: file.name,
        fileUrl: this.files.toStorageKey(file.url),
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        kind: 'REQUIREMENT',
        status: dto.status ?? ApplicationDocumentStatus.PENDING,
        reviewNote: dto.reviewNote ?? null,
        expiresAt: file.expiresAt,
        ...this.uploader(requester),
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

    if (requester.role !== Role.ADMIN) {
      throw new ForbiddenActionException('Only an admin can review documents');
    }
    const ref: ApplicationRef = existing.partnerApplicationId
      ? { type: 'partner', id: existing.partnerApplicationId }
      : { type: 'user', id: existing.applicationId! };
    await this.assertAccess(requester, ref);

    const updated = await this.prisma.applicationDocument.update({
      where: { id },
      data: {
        status: dto.status,
        reviewNote: dto.reviewNote,
        ...(dto.expiresAt !== undefined && {
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        }),
      },
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
        status: true,
        uploadedByRole: true,
      },
    });
    if (!existing) throw new EntityNotFoundException('ApplicationDocument', id);

    const ref: ApplicationRef = existing.partnerApplicationId
      ? { type: 'partner', id: existing.partnerApplicationId }
      : { type: 'user', id: existing.applicationId! };
    await this.assertAccess(requester, ref);

    if (requester.student && existing.uploadedByRole !== Role.CLIENT) {
      throw new ForbiddenActionException('You can only delete files you uploaded');
    }
    // Partners and students can take back their own uploads until they are
    // approved; approved documents and what the admin side sent stay.
    if (requester.role !== Role.ADMIN) {
      if (existing.uploadedByRole === Role.ADMIN) {
        throw new ForbiddenActionException(
          'Documents sent by the admin team cannot be deleted',
        );
      }
      if (existing.status === ApplicationDocumentStatus.APPROVED) {
        throw new ForbiddenActionException(
          'An approved document cannot be deleted',
        );
      }
    }

    await this.prisma.applicationDocument.delete({ where: { id } });

    // Best-effort storage cleanup; do not fail the request if it errors. A file
    // also used elsewhere (the profile, another application) stays.
    await this.files.deleteIfUnused(existing.fileUrl);

    return { id };
  }

  // ── Requirements checklist ───────────────────────────────────────────────────

  /**
   * The application's documents checklist: the process template and the
   * program's own requirements merged, with what was uploaded for each and the
   * profile files that answer it (see src/admissions/checklist.ts).
   */
  async getRequirements(
    requester: Requester,
    ref: ApplicationRef,
  ): Promise<ApplicationRequirementsResponseDto> {
    await this.assertAccess(requester, ref);
    const loaded = await loadChecklist(this.prisma, ref);
    if (!loaded) throw new EntityNotFoundException('Application', ref.id);
    const { checklist } = loaded;
    return {
      templateId: loaded.templateId,
      templateName: loaded.templateName,
      interviewRequired: checklist.interviewRequired,
      summary: checklist.summary,
      steps: checklist.steps.map((step) => ({
        stepId: step.stepId,
        name: step.name,
        description: step.description,
        order: step.order,
        statusKey: step.statusKey,
        stage: step.stage,
        requirements: step.requirements.map((r) => this.mapRequirement(r)),
      })),
      otherDocuments: checklist.otherDocuments.map((d) => this.mapToDto(d)),
    };
  }

  private mapRequirement(item: ChecklistItem<LoadedDocument>): RequirementItemDto {
    return {
      // Also accepted back as `documentTypeId` when uploading for this item.
      documentTypeId: item.key,
      name: item.name,
      description: item.description,
      required: item.required,
      fileTypes: item.fileTypes,
      maxSizeMb: item.maxSizeMb,
      status: item.status,
      kind: item.kind,
      askedBy: item.askedBy,
      label: item.label,
      notes: item.notes,
      quantity: item.quantity,
      documents: item.documents.map((d) => this.mapToDto(d)),
      profileFiles: item.profileFiles.map((f) => this.mapProfileFile(f)),
    };
  }
}

const EXTENSION_ALIASES: Record<string, string[]> = {
  jpg: ['jpg', 'jpeg'],
  jpeg: ['jpg', 'jpeg'],
  doc: ['doc', 'msword'],
  docx: ['docx', 'wordprocessingml'],
  xls: ['xls', 'ms-excel'],
  xlsx: ['xlsx', 'spreadsheetml'],
};

/**
 * Whether a file fits a requirement's accepted types (`["pdf", "jpg"]`), judged
 * by its name's extension or, failing that, its MIME type. A file whose type
 * can't be told is let through; the upload endpoint already limits types.
 */
export function matchesFileTypes(
  fileTypes: string[] | null | undefined,
  name: string | null | undefined,
  mimeType: string | null | undefined,
): boolean {
  const accepted = (fileTypes ?? [])
    .map((t) => t.trim().toLowerCase().replace(/^\./, ''))
    .filter(Boolean);
  if (!accepted.length) return true;
  const ext = /\.([a-z0-9]+)$/i.exec(name ?? '')?.[1]?.toLowerCase();
  const mime = (mimeType ?? '').toLowerCase();
  if (!ext && !mime) return true;
  return accepted.some((t) => {
    if (t.includes('/')) {
      return t.endsWith('/*') ? mime.startsWith(t.slice(0, -1)) : mime === t;
    }
    const names = EXTENSION_ALIASES[t] ?? [t];
    if (ext) return names.includes(ext);
    return names.some((n) => mime.includes(n));
  });
}
