import {
  ApplicationDocumentStatus,
  DocumentRequirementKind,
  RequirementStatus,
} from '@prisma/client';
import { stageForStatusKey } from '../crm-events/process-stage';
import { DOCUMENT_KIND_LABELS, LocalizedLabel } from './document-kinds';

/**
 * The documents an application needs, from both places that ask for them:
 *
 * - the process template (application_process_templates): steps with document
 *   types, the same for every program unless one has its own template;
 * - the program's own admission requirements (program_document_requirements).
 *
 * A kind asked for by both is one item. What answers an item: files uploaded
 * on the application for it, else files of that kind on the applicant's
 * profile. Every item belongs to a stage of the admission process, so the
 * portal, the admin panel and edu-crm place it at the same step.
 */

export interface TemplateDocumentType {
  id: string;
  name: string;
  description: string | null;
  required: boolean;
  fileTypes: string[];
  maxSizeMb: number;
  kind: DocumentRequirementKind | null;
}

export interface TemplateStep {
  id: string;
  name: string;
  description: string | null;
  order: number;
  statusKey: string;
  isActive?: boolean;
  requiredDocuments: TemplateDocumentType[];
}

export interface ProgramRequirement {
  kind: DocumentRequirementKind;
  status: RequirementStatus;
  quantity: number | null;
  labelEn: string | null;
  labelRu: string | null;
  labelUz: string | null;
  notesEn: string | null;
  notesRu: string | null;
  notesUz: string | null;
  sortOrder: number;
}

export interface ChecklistDocument {
  documentTypeId: string | null;
  requirementKind: DocumentRequirementKind | null;
  status: ApplicationDocumentStatus;
}

/** A file on the applicant's profile. */
export interface ProfileFile {
  id: string;
  /** student_documents, or a file field of a client's profile. */
  source: 'student_document' | 'profile';
  kind: DocumentRequirementKind;
  /** The partner portal's type, or the profile field it came from. */
  type: string;
  name: string;
  /** Storage key (or an older link); resolve before showing. */
  url: string;
  fileSize: number | null;
  mimeType: string | null;
  expiresAt: Date | null;
  createdAt: Date | null;
}

export type ItemStatus =
  | 'APPROVED'
  | 'IN_REVIEW'
  | 'PENDING'
  | 'REJECTED'
  | 'MISSING';

export interface ChecklistItem<D> {
  /** documentTypeId, or `kind:<KIND>` for a requirement of the program. */
  key: string;
  documentTypeId: string | null;
  kind: DocumentRequirementKind | null;
  /** template, program, or both. */
  askedBy: 'template' | 'program' | 'both';
  name: string;
  label: LocalizedLabel | null;
  description: string | null;
  notes: LocalizedLabel | null;
  quantity: number | null;
  required: boolean;
  fileTypes: string[];
  maxSizeMb: number;
  status: ItemStatus;
  documents: D[];
  profileFiles: ProfileFile[];
}

export interface ChecklistStep<D> {
  stepId: string;
  name: string;
  description: string | null;
  order: number;
  statusKey: string;
  stage: number;
  requirements: ChecklistItem<D>[];
}

export interface Checklist<D> {
  steps: ChecklistStep<D>[];
  otherDocuments: D[];
  interviewRequired: boolean;
  summary: ChecklistSummary;
}

/** Progress over the required items. */
export interface ChecklistSummary {
  required: number;
  /** Required items with something to look at (approved, pending or in review). */
  uploaded: number;
  approved: number;
  rejected: number;
}

/** Accepted for a program requirement, which names no file types of its own. */
export const PROGRAM_FILE_TYPES = ['pdf', 'jpg', 'jpeg', 'png'];
export const PROGRAM_MAX_SIZE_MB = 10;
export const PROGRAM_STEP_ID = 'program';

/** Asked for, but not a file anyone can upload. */
const NOT_A_FILE: DocumentRequirementKind[] = ['INTERVIEW'];

export const programItemKey = (kind: DocumentRequirementKind) => `kind:${kind}`;

export function itemStatus(
  documents: { status: ApplicationDocumentStatus }[],
  hasProfileFile: boolean,
): ItemStatus {
  if (!documents.length) return hasProfileFile ? 'PENDING' : 'MISSING';
  if (documents.some((d) => d.status === 'APPROVED')) return 'APPROVED';
  if (documents.every((d) => d.status === 'REJECTED')) return 'REJECTED';
  if (documents.some((d) => d.status === 'IN_REVIEW')) return 'IN_REVIEW';
  return 'PENDING';
}

export function buildChecklist<D extends ChecklistDocument>(input: {
  steps: TemplateStep[];
  program: ProgramRequirement[];
  documents: D[];
  profileFiles: ProfileFile[];
}): Checklist<D> {
  const asked = mergeProgram(input.program);
  const usedDocs = new Set<D>();
  const take = (match: (d: D) => boolean) => {
    const found = input.documents.filter((d) => !usedDocs.has(d) && match(d));
    found.forEach((d) => usedDocs.add(d));
    return found;
  };
  const filesOf = (kind: DocumentRequirementKind | null) =>
    kind && kind !== 'OTHER'
      ? input.profileFiles.filter((f) => f.kind === kind)
      : [];

  const steps: ChecklistStep<D>[] = [];
  const covered = new Set<DocumentRequirementKind>();
  for (const step of [...input.steps].sort((a, b) => a.order - b.order)) {
    if (step.isActive === false) continue;
    steps.push({
      stepId: step.id,
      name: step.name,
      description: step.description,
      order: step.order,
      statusKey: step.statusKey,
      stage: stageForStatusKey(step.statusKey),
      requirements: step.requiredDocuments.map((type) => {
        // The first document type of a kind stands for the program's
        // requirement of that kind too.
        const program =
          type.kind && !covered.has(type.kind)
            ? asked.get(type.kind)
            : undefined;
        if (type.kind) covered.add(type.kind);
        const documents = take(
          (d) =>
            d.documentTypeId === type.id ||
            (!d.documentTypeId &&
              !!type.kind &&
              d.requirementKind === type.kind),
        );
        const profileFiles = filesOf(type.kind);
        return {
          key: type.id,
          documentTypeId: type.id,
          kind: type.kind,
          askedBy: program ? 'both' : 'template',
          name: type.name,
          label: program?.label ?? null,
          description: type.description,
          notes: program?.notes ?? null,
          quantity: program?.quantity ?? null,
          required: type.required || !!program?.required,
          fileTypes: type.fileTypes ?? [],
          maxSizeMb: type.maxSizeMb,
          status: itemStatus(documents, profileFiles.length > 0),
          documents,
          profileFiles,
        };
      }),
    });
  }

  const programItems: ChecklistItem<D>[] = [];
  for (const [kind, program] of asked) {
    if (covered.has(kind)) continue;
    const documents = take(
      (d) => !d.documentTypeId && d.requirementKind === kind,
    );
    const profileFiles = filesOf(kind);
    programItems.push({
      key: programItemKey(kind),
      documentTypeId: null,
      kind,
      askedBy: 'program',
      name: program.label?.en ?? DOCUMENT_KIND_LABELS[kind].en,
      label: program.label ?? DOCUMENT_KIND_LABELS[kind],
      description: null,
      notes: program.notes,
      quantity: program.quantity,
      required: program.required,
      fileTypes: PROGRAM_FILE_TYPES,
      maxSizeMb: PROGRAM_MAX_SIZE_MB,
      status: itemStatus(documents, profileFiles.length > 0),
      documents,
      profileFiles,
    });
  }
  if (programItems.length) {
    // What the program asks for is collected before submitting.
    steps.unshift({
      stepId: PROGRAM_STEP_ID,
      name: 'Program requirements',
      description: null,
      order: 0,
      statusKey: 'DRAFT',
      stage: stageForStatusKey('DRAFT'),
      requirements: programItems,
    });
  }

  const summary: ChecklistSummary = {
    required: 0,
    uploaded: 0,
    approved: 0,
    rejected: 0,
  };
  for (const item of steps.flatMap((s) => s.requirements)) {
    if (!item.required) continue;
    summary.required++;
    if (item.status === 'APPROVED') summary.approved++;
    if (item.status === 'REJECTED') summary.rejected++;
    if (item.status !== 'MISSING' && item.status !== 'REJECTED')
      summary.uploaded++;
  }

  return {
    steps,
    otherDocuments: input.documents.filter((d) => !usedDocs.has(d)),
    interviewRequired: input.program.some(
      (r) => r.kind === 'INTERVIEW' && r.status !== 'NOT_REQUIRED',
    ),
    summary,
  };
}

interface MergedRequirement {
  required: boolean;
  quantity: number | null;
  label: LocalizedLabel | null;
  notes: LocalizedLabel | null;
}

/** One entry per kind the program asks for, in the program's order. */
function mergeProgram(
  rows: ProgramRequirement[],
): Map<DocumentRequirementKind, MergedRequirement> {
  const out = new Map<DocumentRequirementKind, MergedRequirement>();
  for (const row of [...rows].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (row.status === 'NOT_REQUIRED' || NOT_A_FILE.includes(row.kind))
      continue;
    const label = localized(row.labelEn, row.labelRu, row.labelUz);
    const notes = localized(row.notesEn, row.notesRu, row.notesUz);
    const seen = out.get(row.kind);
    if (!seen) {
      out.set(row.kind, {
        required: row.status === 'REQUIRED',
        quantity: row.quantity,
        label,
        notes,
      });
      continue;
    }
    seen.required ||= row.status === 'REQUIRED';
    seen.label = join(seen.label, label, ', ');
    seen.notes = join(seen.notes, notes, '\n');
  }
  return out;
}

function localized(
  en: string | null,
  ru: string | null,
  uz: string | null,
): LocalizedLabel | null {
  const any = en?.trim() || ru?.trim() || uz?.trim();
  if (!any) return null;
  return {
    en: en?.trim() || any,
    ru: ru?.trim() || any,
    uz: uz?.trim() || any,
  };
}

function join(
  a: LocalizedLabel | null,
  b: LocalizedLabel | null,
  sep: string,
): LocalizedLabel | null {
  if (!a) return b;
  if (!b) return a;
  return {
    en: a.en + sep + b.en,
    ru: a.ru + sep + b.ru,
    uz: a.uz + sep + b.uz,
  };
}
