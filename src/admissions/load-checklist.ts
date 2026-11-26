import { Prisma } from '@prisma/client';
import { buildChecklist, Checklist } from './checklist';
import { clientProfileFiles, studentProfileFiles } from './profile-files';

type Db = Prisma.TransactionClient;

/** A partner's application (partner_applications) or a client's (applications). */
export type ApplicationRef =
  | { type: 'partner'; id: string }
  | { type: 'user'; id: string };

const DOCUMENT_INCLUDE = {
  documentType: { select: { name: true } },
  uploadedBy: {
    select: {
      id: true,
      email: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.ApplicationDocumentInclude;

export type LoadedDocument = Prisma.ApplicationDocumentGetPayload<{
  include: typeof DOCUMENT_INCLUDE;
}>;

export interface LoadedChecklist {
  templateId: string | null;
  templateName: string | null;
  checklist: Checklist<LoadedDocument>;
}

/** The application's documents checklist, or null when there is no such application. */
export async function loadChecklist(
  db: Db,
  ref: ApplicationRef,
): Promise<LoadedChecklist | null> {
  const owner =
    ref.type === 'partner'
      ? await db.partnerApplication.findUnique({
          where: { id: ref.id },
          select: { programId: true, partnerStudentId: true },
        })
      : await db.application.findUnique({
          where: { id: ref.id },
          select: { preferredProgram: true, profileId: true },
        });
  if (!owner) return null;
  const programId =
    'programId' in owner ? owner.programId : owner.preferredProgram;

  const [template, program, documents, profileFiles] = await Promise.all([
    loadTemplate(db, programId),
    db.programDocumentRequirement.findMany({
      where: { requirement: { universityProgramId: programId } },
      orderBy: { sortOrder: 'asc' },
    }),
    db.applicationDocument.findMany({
      where:
        ref.type === 'partner'
          ? { partnerApplicationId: ref.id }
          : { applicationId: ref.id },
      include: DOCUMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    }),
    'partnerStudentId' in owner
      ? studentProfileFiles(db, owner.partnerStudentId)
      : clientProfileFiles(db, owner.profileId),
  ]);

  return {
    templateId: template?.id ?? null,
    templateName: template?.name ?? null,
    checklist: buildChecklist({
      steps: template?.steps ?? [],
      program,
      documents,
      profileFiles,
    }),
  };
}

const TEMPLATE_INCLUDE = {
  steps: {
    include: { requiredDocuments: { orderBy: { createdAt: 'asc' } } },
    orderBy: { order: 'asc' },
  },
} satisfies Prisma.ApplicationProcessTemplateInclude;

/** The program's own process template, else the default one. */
async function loadTemplate(db: Db, programId: string) {
  return (
    (await db.applicationProcessTemplate.findUnique({
      where: { programId },
      include: TEMPLATE_INCLUDE,
    })) ??
    (await db.applicationProcessTemplate.findFirst({
      where: { isDefault: true },
      include: TEMPLATE_INCLUDE,
    }))
  );
}
