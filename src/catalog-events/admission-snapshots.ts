import { Prisma } from '@prisma/client';
import { ApplicationRef, loadChecklist } from '../admissions/load-checklist';
import {
  clientProfileFiles,
  studentProfileFiles,
} from '../admissions/profile-files';
import { ProfileFile } from '../admissions/checklist';
import { normalizeStage } from '../crm-events/process-stage';

/**
 * What edu-crm receives about people and admissions (docs/student-events.md):
 * every applicant (partner students and client accounts alike), every
 * application, mini applications and admin accounts.
 *
 * Passport numbers, addresses and parents' names are left out: the CRM reads
 * them from the API when someone opens the profile.
 */
type Db = Prisma.TransactionClient;
type Snapshot = Record<string, unknown> | null;

/** An admin of this service; may sign in to edu-crm. No password leaves here. */
export async function loadAdminAccount(
  db: Db,
  userId: string,
): Promise<Snapshot> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      passwordChangedAt: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: { firstName: true, lastName: true, phoneNumber: true },
      },
    },
  });
  if (!user || user.role !== 'ADMIN') return null;
  const name = personName(user.profile);
  return {
    id: user.id,
    email: user.email,
    firstName: name.firstName,
    lastName: name.lastName,
    phone: user.profile?.phoneNumber ?? null,
    passwordChangedAt: user.passwordChangedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** A partner's student. */
export async function loadPartnerStudent(
  db: Db,
  id: string,
): Promise<Snapshot> {
  const s = await db.partnerStudent.findUnique({ where: { id } });
  if (!s) return null;
  const files = await studentProfileFiles(db, id);
  return {
    id: s.id,
    kind: 'partner',
    partnerId: s.partnerId,
    organizationId: await partnerOrganizationId(db, s.partnerId),
    firstName: s.firstName,
    lastName: s.lastName,
    middleName: s.middleName,
    phone: s.phone,
    email: s.email,
    dateOfBirth: s.dateOfBirth,
    gender: s.gender,
    nationality: s.countryOfCitizenship,
    country: s.country,
    city: s.city,
    passportExpiryDate: s.passportExpiryDate,
    hasPassport: !!s.passportNumber?.trim(),
    leadSource: s.leadSource,
    profile: {
      desiredLevel: s.desiredEducationLevel || null,
      education: studentEducation(s),
      tests: studentTests(s.testScores),
    },
    documentKinds: kindsOf(files),
    documentExpiries: expiriesOf(files),
    origin: s.origin,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

/** A client account on the public site, keyed by the user id. */
export async function loadClientApplicant(
  db: Db,
  userId: string,
): Promise<Snapshot> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        include: {
          educationHistory: { orderBy: { graduationYear: 'desc' } },
          languageCertificates: { orderBy: { dateOfIssue: 'desc' } },
          standardizedTests: { orderBy: { dateOfIssue: 'desc' } },
        },
      },
    },
  });
  if (!user || user.role !== 'CLIENT') return null;
  const p = user.profile;
  const files = p ? await clientProfileFiles(db, p.id) : [];
  return {
    id: user.id,
    kind: 'client',
    profileId: p?.id ?? null,
    ...personName(p),
    middleName: p?.middleName ?? null,
    phone: p?.phoneNumber ?? null,
    email: p?.email?.trim() || user.email,
    accountEmail: user.email,
    dateOfBirth: p?.dateOfBirth ?? null,
    gender: p?.gender ?? null,
    nationality: p?.nationality ?? null,
    country: null,
    city: null,
    passportExpiryDate: p?.passportExpiryDate ?? null,
    hasPassport: !!p?.passportSeriesAndNumber?.trim(),
    leadSource: null,
    profile: {
      desiredLevel: null,
      education: (p?.educationHistory ?? []).map((e) => ({
        level: e.degree,
        institution: e.institution,
        graduationYear: e.graduationYear,
        gpa: e.gpa === null ? null : String(e.gpa),
        gpaScale: null,
        country: null,
      })),
      tests: [
        ...(p?.languageCertificates ?? []).map((c) => ({
          test: c.testType,
          score: String(c.score),
          date: c.dateOfIssue,
        })),
        ...(p?.standardizedTests ?? []).map((t) => ({
          test: t.testType,
          score: String(t.score),
          date: t.dateOfIssue,
        })),
      ],
    },
    documentKinds: kindsOf(files),
    documentExpiries: expiriesOf(files),
    origin: 'SITE',
    createdAt: p?.createdAt ?? user.createdAt,
    updatedAt: p && p.updatedAt > user.updatedAt ? p.updatedAt : user.updatedAt,
  };
}

/** An application a partner made for a student. */
export async function loadPartnerApplication(
  db: Db,
  id: string,
): Promise<Snapshot> {
  const a = await db.partnerApplication.findUnique({ where: { id } });
  if (!a) return null;
  return {
    id: a.id,
    kind: 'partner',
    partnerId: a.partnerId,
    organizationId: await partnerOrganizationId(db, a.partnerId),
    applicantId: a.partnerStudentId,
    partnerStudentId: a.partnerStudentId,
    universityId: a.universityId,
    programId: a.programId,
    intakeSeason: a.intakeSeason,
    intakeYear: a.intakeYear,
    intakeId: a.intakeId,
    status: a.status,
    // The stage always agrees with the status.
    stage: normalizeStage(a.status, a.stage),
    rejectionReason: a.rejectionReason,
    submittedAt: a.submittedAt,
    reviewedAt: a.reviewedAt,
    statusChangedAt: a.statusChangedAt,
    detailsChangedAt: a.detailsChangedAt,
    visaStatus: a.visaStatus,
    notes: a.notes,
    adminNotes: a.adminNotes,
    englishProficiency: a.englishProficiency,
    gpa: a.gpa,
    prerequisites: a.prerequisites,
    backupPrograms: backupPrograms(a.backupPrograms),
    ...(await documents(db, { type: 'partner', id })),
    origin: a.origin,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

/** An application a client submitted on the public site. */
export async function loadClientApplication(
  db: Db,
  id: string,
): Promise<Snapshot> {
  const a = await db.application.findUnique({
    where: { id },
    include: { profile: { select: { userId: true } } },
  });
  if (!a) return null;
  return {
    id: a.id,
    kind: 'client',
    partnerId: null,
    organizationId: null,
    applicantId: a.profile.userId,
    universityId: a.preferredUniversity,
    programId: a.preferredProgram,
    intakeSeason: a.intakeSeason,
    intakeYear: a.intakeYear,
    intakeId: a.intakeId,
    status: a.status,
    stage: normalizeStage(a.status, a.stage),
    rejectionReason: a.rejectionReason,
    submittedAt: a.submittedAt,
    reviewedAt: null,
    statusChangedAt: a.statusChangedAt,
    detailsChangedAt: a.detailsChangedAt,
    visaStatus: a.visaStatus,
    notes: null,
    adminNotes: null,
    englishProficiency: null,
    gpa: null,
    prerequisites: null,
    backupPrograms: [],
    ...(await documents(db, { type: 'user', id })),
    origin: a.origin,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

/** A request left on the public site (quick form, services page). */
export async function loadMiniApplication(
  db: Db,
  id: string,
): Promise<Snapshot> {
  const m = await db.miniApplication.findUnique({ where: { id } });
  if (!m) return null;
  return {
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    phone: m.phoneNumber,
    source: m.source,
    service: m.service,
    country: m.country,
    notes: m.notes,
    universityId: m.universityId,
    status: m.status,
    statusChangedAt: m.statusChangedAt,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
}

/** The organization a partner user acts under: owned, or joined as a member. */
export async function partnerOrganizationId(
  db: Db,
  userId: string,
): Promise<string | null> {
  const owned = await db.partnerOrganization.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (owned) return owned.id;
  const member = await db.partnerMember.findUnique({
    where: { userId },
    select: { organizationId: true },
  });
  return member?.organizationId ?? null;
}

/** Progress of the documents checklist, and which documents expire when. */
async function documents(db: Db, ref: ApplicationRef) {
  const loaded = await loadChecklist(db, ref);
  if (!loaded) return { documents: null, documentExpiries: [] };
  const uploads = [
    ...loaded.checklist.steps.flatMap((s) =>
      s.requirements.flatMap((r) =>
        r.documents.map((d) => ({ doc: d, kind: r.kind, label: r.name })),
      ),
    ),
    ...loaded.checklist.otherDocuments.map((d) => ({
      doc: d,
      kind: null,
      label: d.name,
    })),
  ];
  return {
    documents: loaded.checklist.summary,
    documentExpiries: uploads
      .filter(({ doc }) => doc.expiresAt && doc.status !== 'REJECTED')
      .map(({ doc, kind, label }) => ({
        kind,
        name: label,
        expiresAt: doc.expiresAt,
      })),
  };
}

const kindsOf = (files: ProfileFile[]) => [
  ...new Set(files.map((f) => f.kind)),
];

const expiriesOf = (files: ProfileFile[]) =>
  files
    .filter((f) => f.expiresAt && f.kind !== 'PASSPORT') // the passport has its own date
    .map((f) => ({ kind: f.kind, name: f.name, expiresAt: f.expiresAt }));

/**
 * Sign-up used to fill in "User Profile" when no name was given; that is no
 * name, not somebody called User.
 */
function personName(
  p: { firstName: string | null; lastName: string | null } | null | undefined,
) {
  const firstName = p?.firstName?.trim() || null;
  const lastName = p?.lastName?.trim() || null;
  if (firstName === 'User' && lastName === 'Profile') {
    return { firstName: null, lastName: null };
  }
  return { firstName, lastName };
}

/** JSON columns hold an array, or a string with an array in it (older rows). */
function jsonArray(value: unknown): Record<string, any>[] {
  if (Array.isArray(value)) return value as Record<string, any>[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const text = (value: unknown): string | null =>
  value === null || value === undefined || String(value).trim() === ''
    ? null
    : String(value).trim();

function backupPrograms(value: unknown) {
  return jsonArray(value).map((b) => ({
    programId: text(b.programId),
    universityId: text(b.universityId),
    programTitle: text(b.programTitle),
    universityName: text(b.universityName),
  }));
}

function studentEducation(s: {
  schools: unknown;
  highestLevelOfEducation: string | null;
  gradeAverage: string | null;
  gradeScaleOutOf: string | null;
  countryOfEducation: string | null;
}) {
  const schools = jsonArray(s.schools).map((x) => ({
    level: text(x.educationLevel),
    institution: text(x.schoolName),
    graduationYear: Number(/\d{4}/.exec(String(x.to ?? ''))?.[0]) || null,
    gpa: text(x.gradeAverage),
    gpaScale: text(x.gradeScaleOutOf),
    country: text(x.country),
  }));
  if (schools.length) return schools;
  if (!s.highestLevelOfEducation && !s.gradeAverage) return [];
  return [
    {
      level: text(s.highestLevelOfEducation),
      institution: null,
      graduationYear: null,
      gpa: text(s.gradeAverage),
      gpaScale: text(s.gradeScaleOutOf),
      country: text(s.countryOfEducation),
    },
  ];
}

const TESTS = ['ielts', 'toefl', 'duolingo', 'sat', 'act', 'gre', 'gmat'];

function studentTests(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const scores = value as Record<string, unknown>;
  return TESTS.filter((t) => text(scores[t])).map((t) => ({
    test: t.toUpperCase(),
    score: text(scores[t]),
    date: text(scores[`${t}Date`]),
  }));
}
