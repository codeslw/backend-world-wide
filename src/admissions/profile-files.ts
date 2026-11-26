import { DocumentRequirementKind, Prisma } from '@prisma/client';
import { ProfileFile } from './checklist';
import { kindOfStudentDocument } from './document-kinds';

type Db = Prisma.TransactionClient;

/** Files on a partner student's profile (student_documents). */
export async function studentProfileFiles(
  db: Db,
  studentId: string,
): Promise<ProfileFile[]> {
  const docs = await db.studentDocument.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });
  return docs.map((d) => ({
    id: d.id,
    source: 'student_document' as const,
    kind: kindOfStudentDocument(d.type),
    type: d.type,
    name: d.name,
    url: d.url,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    expiresAt: d.expiresAt,
    createdAt: d.createdAt,
  }));
}

interface FileField {
  guid: string | null | undefined;
  kind: DocumentRequirementKind;
  type: string;
  expiresAt?: Date | null;
}

/**
 * Files on a client's profile: the passport copy, CV and letters, and the files
 * attached to education entries and test results. The profile stores File ids.
 */
export async function clientProfileFiles(
  db: Db,
  profileId: string,
): Promise<ProfileFile[]> {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: {
      passportCopyGuid: true,
      passportExpiryDate: true,
      cvGuid: true,
      motivationLetterGuid: true,
      recommendationLetterGuids: true,
      educationHistory: { select: { transcriptGuid: true, diplomaGuid: true } },
      languageCertificates: {
        select: { certificateGuid: true, testType: true },
      },
      standardizedTests: { select: { certificateGuid: true, testType: true } },
    },
  });
  if (!profile) return [];
  const fields: FileField[] = [
    {
      guid: profile.passportCopyGuid,
      kind: 'PASSPORT',
      type: 'passport',
      expiresAt: profile.passportExpiryDate,
    },
    { guid: profile.cvGuid, kind: 'CV', type: 'cv' },
    {
      guid: profile.motivationLetterGuid,
      kind: 'MOTIVATION_LETTER',
      type: 'motivation_letter',
    },
    ...profile.recommendationLetterGuids.map((guid) => ({
      guid,
      kind: 'RECOMMENDATION_LETTER' as const,
      type: 'letter_of_referral',
    })),
    ...profile.educationHistory.flatMap((e) => [
      {
        guid: e.transcriptGuid,
        kind: 'TRANSCRIPT' as const,
        type: 'transcript',
      },
      { guid: e.diplomaGuid, kind: 'DIPLOMA' as const, type: 'diploma' },
    ]),
    ...profile.languageCertificates.map((c) => ({
      guid: c.certificateGuid,
      kind: 'ENGLISH_CERTIFICATE' as const,
      type: c.testType.toLowerCase(),
    })),
    ...profile.standardizedTests.map((t) => ({
      guid: t.certificateGuid,
      kind: 'STANDARDIZED_TEST_SCORE' as const,
      type: t.testType.toLowerCase(),
    })),
  ];
  const wanted = fields.filter(
    (f): f is FileField & { guid: string } => !!f.guid,
  );
  if (!wanted.length) return [];
  const files = await db.file.findMany({
    where: { id: { in: [...new Set(wanted.map((f) => f.guid))] } },
  });
  const byId = new Map(files.map((f) => [f.id, f]));
  const out: ProfileFile[] = [];
  const seen = new Set<string>();
  for (const field of wanted) {
    const file = byId.get(field.guid);
    const key = `${field.kind}:${field.guid}`;
    if (!file || seen.has(key)) continue; // removed from storage, or listed twice
    seen.add(key);
    out.push({
      id: file.id,
      source: 'profile',
      kind: field.kind,
      type: field.type,
      name: file.filename,
      url: file.url,
      fileSize: null,
      mimeType: null,
      expiresAt: field.expiresAt ?? null,
      createdAt: file.createdAt,
    });
  }
  return out;
}
