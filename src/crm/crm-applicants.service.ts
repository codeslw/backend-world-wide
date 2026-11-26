import { Injectable } from '@nestjs/common';
import {
  DegreeType,
  LanguageTest,
  Prisma,
  StandardizedTestType,
} from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { FilesService } from '../files/files.service';
import {
  EntityNotFoundException,
  InvalidDataException,
} from '../common/exceptions/app.exceptions';
import { ProfileFile } from '../admissions/checklist';
import {
  clientProfileFiles,
  studentProfileFiles,
} from '../admissions/profile-files';
import {
  CrmEducationDto,
  CrmTestDto,
  UpdateCrmApplicantDto,
} from './dto/crm-applicant.dto';

type Kind = 'partner' | 'client';

const LANGUAGE_TESTS = new Set<string>(Object.values(LanguageTest));
const STANDARD_TESTS = new Set<string>(Object.values(StandardizedTestType));
const DEGREES = new Set<string>(Object.values(DegreeType));
/** Keys of partner_students.testScores that hold a score. */
const STUDENT_TESTS = [
  'IELTS',
  'TOEFL',
  'DUOLINGO',
  'SAT',
  'ACT',
  'GRE',
  'GMAT',
];

/**
 * An applicant's whole profile for edu-crm, in one shape whether it is a
 * partner's student or a client account, and the edits made there.
 */
@Injectable()
export class CrmApplicantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
  ) {}

  get(kind: Kind, id: string) {
    return kind === 'partner' ? this.student(id) : this.client(id);
  }

  private async student(id: string) {
    const s = await this.prisma.partnerStudent.findUnique({
      where: { id },
      include: {
        partner: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { firstName: true, lastName: true, phoneNumber: true },
            },
            partnerOrganization: {
              select: { id: true, name: true, phone: true, email: true },
            },
            partnerMembership: {
              select: {
                organization: {
                  select: { id: true, name: true, phone: true, email: true },
                },
              },
            },
          },
        },
        studentDocuments: {
          include: {
            uploadedBy: {
              select: {
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
    if (!s) throw new EntityNotFoundException('PartnerStudent', id);
    const org =
      s.partner.partnerOrganization ??
      s.partner.partnerMembership?.organization ??
      null;
    const uploader = new Map(
      s.studentDocuments.map((d) => [
        d.id,
        {
          role: d.uploadedByRole,
          name:
            fullName(d.uploadedBy?.profile) ||
            d.uploadedBy?.email ||
            d.uploadedByName ||
            null,
        },
      ]),
    );
    const schools = jsonArray(s.schools);
    return {
      id: s.id,
      kind: 'partner',
      firstName: s.firstName,
      lastName: s.lastName,
      middleName: s.middleName,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      nationality: s.countryOfCitizenship,
      maritalStatus: s.maritalStatus,
      firstLanguage: s.firstLanguage,
      phone: s.phone,
      email: s.email,
      accountEmail: null,
      passportNumber: s.passportNumber,
      passportExpiryDate: s.passportExpiryDate,
      passportPlaceOfBirth: s.passportPlaceOfBirth,
      address: s.streetAddress,
      city: s.city,
      country: s.country,
      fatherFullName: s.fatherFullName,
      motherFullName: s.motherFullName,
      emergencyName: s.emergencyName,
      emergencyPhone: s.emergencyPhone,
      emergencyRelation: s.emergencyRelation,
      desiredLevel: s.desiredEducationLevel,
      financialSupport: s.financialSupport,
      leadSource: s.leadSource,
      howHeard: s.howHeard,
      studentAgent: s.studentAgent,
      additionalNotes: s.additionalNotes,
      education: schools.length
        ? schools.map((x, i) => ({
            id: `school:${i}`,
            level: text(x.educationLevel) ?? '',
            institution: text(x.schoolName),
            graduationYear: yearOf(x.to),
            gpa: text(x.gradeAverage),
            gpaScale: text(x.gradeScaleOutOf),
            country: text(x.country),
          }))
        : s.highestLevelOfEducation || s.gradeAverage
          ? [
              {
                id: null,
                level: s.highestLevelOfEducation ?? '',
                institution: null,
                graduationYear: null,
                gpa: text(s.gradeAverage),
                gpaScale: text(s.gradeScaleOutOf),
                country: text(s.countryOfEducation),
              },
            ]
          : [],
      tests: studentTests(s.testScores),
      agency: org
        ? { id: org.id, name: org.name, phone: org.phone, email: org.email }
        : null,
      partner: {
        id: s.partner.id,
        name: fullName(s.partner.profile) || s.partner.email,
        email: s.partner.email,
        phone: s.partner.profile?.phoneNumber ?? null,
      },
      files: this.mapFiles(
        await studentProfileFiles(this.prisma, id),
        uploader,
      ),
      editable: true,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  private async client(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            educationHistory: { orderBy: { graduationYear: 'desc' } },
            languageCertificates: { orderBy: { dateOfIssue: 'desc' } },
            standardizedTests: { orderBy: { dateOfIssue: 'desc' } },
          },
        },
      },
    });
    if (!user || user.role !== 'CLIENT') {
      throw new EntityNotFoundException('Client', userId);
    }
    const p = user.profile;
    return {
      id: user.id,
      kind: 'client',
      firstName: p?.firstName ?? null,
      lastName: p?.lastName ?? null,
      middleName: p?.middleName ?? null,
      dateOfBirth: p?.dateOfBirth ?? null,
      gender: p?.gender ?? null,
      nationality: p?.nationality ?? null,
      maritalStatus: null,
      firstLanguage: null,
      phone: p?.phoneNumber ?? null,
      email: p?.email ?? user.email,
      accountEmail: user.email,
      passportNumber: p?.passportSeriesAndNumber ?? null,
      passportExpiryDate: p?.passportExpiryDate ?? null,
      passportPlaceOfBirth: null,
      address: p?.address ?? null,
      city: null,
      country: null,
      fatherFullName: null,
      motherFullName: null,
      emergencyName: null,
      emergencyPhone: null,
      emergencyRelation: null,
      desiredLevel: null,
      financialSupport: null,
      leadSource: null,
      howHeard: null,
      studentAgent: null,
      additionalNotes: null,
      education: (p?.educationHistory ?? []).map((e) => ({
        id: e.id,
        level: e.degree,
        institution: e.institution,
        graduationYear: e.graduationYear,
        gpa: e.gpa === null ? null : String(e.gpa),
        gpaScale: null,
        country: null,
      })),
      tests: [
        ...(p?.languageCertificates ?? []),
        ...(p?.standardizedTests ?? []),
      ].map((t) => ({
        id: t.id,
        test: t.testType as string,
        score: String(t.score),
        date: t.dateOfIssue,
      })),
      agency: null,
      partner: null,
      files: this.mapFiles(
        p ? await clientProfileFiles(this.prisma, p.id) : [],
      ),
      editable: true,
      createdAt: p?.createdAt ?? user.createdAt,
      updatedAt: p?.updatedAt ?? user.updatedAt,
    };
  }

  private mapFiles(
    files: ProfileFile[],
    uploader?: Map<string, { role: string | null; name: string | null }>,
  ) {
    return files.map((f) => ({
      id: f.id,
      source: f.source,
      kind: f.kind,
      type: f.type,
      name: f.name,
      url: this.files.toPublicUrl(f.url) ?? f.url,
      size: f.fileSize,
      mimeType: f.mimeType,
      expiresAt: f.expiresAt,
      uploadedByRole: uploader?.get(f.id)?.role ?? null,
      uploadedByName: uploader?.get(f.id)?.name ?? null,
      createdAt: f.createdAt,
    }));
  }

  async update(kind: Kind, id: string, dto: UpdateCrmApplicantDto) {
    if (kind === 'partner') await this.updateStudent(id, dto);
    else await this.updateClient(id, dto);
    return this.get(kind, id);
  }

  private async updateStudent(id: string, dto: UpdateCrmApplicantDto) {
    const current = await this.prisma.partnerStudent.findUnique({
      where: { id },
      select: { schools: true, testScores: true },
    });
    if (!current) throw new EntityNotFoundException('PartnerStudent', id);
    await this.prisma.partnerStudent.update({
      where: { id },
      data: {
        ...given(dto, {
          middleName: 'middleName',
          gender: 'gender',
          nationality: 'countryOfCitizenship',
          maritalStatus: 'maritalStatus',
          passportNumber: 'passportNumber',
          address: 'streetAddress',
          city: 'city',
          country: 'country',
          fatherFullName: 'fatherFullName',
          motherFullName: 'motherFullName',
          emergencyName: 'emergencyName',
          emergencyPhone: 'emergencyPhone',
          emergencyRelation: 'emergencyRelation',
        }),
        ...givenDates(dto, {
          dateOfBirth: 'dateOfBirth',
          passportExpiryDate: 'passportExpiryDate',
        }),
        ...(dto.education && {
          schools: mergeSchools(
            jsonArray(current.schools),
            dto.education,
          ) as Prisma.InputJsonValue,
        }),
        ...(dto.tests && {
          testScores: mergeScores(
            current.testScores,
            dto.tests,
          ) as Prisma.InputJsonValue,
        }),
      },
    });
  }

  private async updateClient(userId: string, dto: UpdateCrmApplicantDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        profile: {
          select: {
            id: true,
            educationHistory: true,
            languageCertificates: true,
            standardizedTests: true,
          },
        },
      },
    });
    if (!user || user.role !== 'CLIENT') {
      throw new EntityNotFoundException('Client', userId);
    }
    const fields = {
      ...given(dto, {
        middleName: 'middleName',
        gender: 'gender',
        nationality: 'nationality',
        passportNumber: 'passportSeriesAndNumber',
        address: 'address',
      }),
      ...givenDates(dto, {
        dateOfBirth: 'dateOfBirth',
        passportExpiryDate: 'passportExpiryDate',
      }),
    };
    await this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.upsert({
        where: { userId },
        update: fields,
        create: { userId, ...fields },
        select: { id: true },
      });
      if (dto.education) {
        await this.saveClientEducation(
          tx,
          profile.id,
          (user.profile?.educationHistory ?? []).map((e) => e.id),
          dto.education,
        );
      }
      if (dto.tests) {
        await this.saveClientTests(
          tx,
          profile.id,
          (user.profile?.languageCertificates ?? []).map((t) => t.id),
          (user.profile?.standardizedTests ?? []).map((t) => t.id),
          dto.tests,
        );
      }
    });
  }

  /** Rows keep their transcripts and diplomas: entries are matched by id. */
  private async saveClientEducation(
    tx: Prisma.TransactionClient,
    profileId: string,
    existing: string[],
    entries: CrmEducationDto[],
  ) {
    const keep = entries
      .map((e) => e.id)
      .filter((id) => id && existing.includes(id));
    await tx.education.deleteMany({
      where: { profileId, id: { notIn: keep } },
    });
    for (const e of entries) {
      if (!e.institution?.trim() || !e.graduationYear) {
        throw new InvalidDataException(
          'Education needs an institution and a graduation year',
        );
      }
      const gpa = e.gpa?.trim() ? Number(e.gpa.replace(',', '.')) : null;
      if (gpa !== null && Number.isNaN(gpa)) {
        throw new InvalidDataException('GPA must be a number');
      }
      const data = {
        degree: (DEGREES.has(e.level) ? e.level : 'OTHER') as DegreeType,
        institution: e.institution.trim(),
        graduationYear: e.graduationYear,
        gpa,
      };
      if (e.id && existing.includes(e.id)) {
        await tx.education.update({ where: { id: e.id }, data });
      } else {
        await tx.education.create({ data: { ...data, profileId } });
      }
    }
  }

  private async saveClientTests(
    tx: Prisma.TransactionClient,
    profileId: string,
    languages: string[],
    standard: string[],
    tests: CrmTestDto[],
  ) {
    const ids = tests.map((t) => t.id).filter(Boolean) as string[];
    await tx.languageCertificate.deleteMany({
      where: { profileId, id: { notIn: ids } },
    });
    await tx.standardizedTest.deleteMany({
      where: { profileId, id: { notIn: ids } },
    });
    for (const t of tests) {
      const type = t.test.trim().toUpperCase();
      const score = Number(t.score.replace(',', '.'));
      if (Number.isNaN(score)) {
        throw new InvalidDataException('A test score must be a number');
      }
      if (!t.date) throw new InvalidDataException('A test needs its date');
      const dateOfIssue = new Date(t.date);
      if (LANGUAGE_TESTS.has(type)) {
        const data = { testType: type as LanguageTest, score, dateOfIssue };
        if (t.id && languages.includes(t.id)) {
          await tx.languageCertificate.update({ where: { id: t.id }, data });
        } else {
          await tx.languageCertificate.create({ data: { ...data, profileId } });
        }
      } else if (STANDARD_TESTS.has(type)) {
        const data = {
          testType: type as StandardizedTestType,
          score: Math.round(score),
          dateOfIssue,
        };
        if (t.id && standard.includes(t.id)) {
          await tx.standardizedTest.update({ where: { id: t.id }, data });
        } else {
          await tx.standardizedTest.create({ data: { ...data, profileId } });
        }
      } else {
        throw new InvalidDataException(`Unknown test ${t.test}`);
      }
    }
  }
}

/** Copies the given fields under their column names; an empty text clears. */
function given<T extends object>(
  dto: T,
  map: Partial<Record<keyof T, string>>,
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [from, to] of Object.entries(map) as [keyof T, string][]) {
    const value = dto[from];
    if (value === undefined) continue;
    out[to] = typeof value === 'string' ? value.trim() || null : value;
  }
  return out;
}

function givenDates<T extends object>(
  dto: T,
  map: Partial<Record<keyof T, string>>,
): Record<string, Date | null> {
  const out: Record<string, Date | null> = {};
  for (const [from, to] of Object.entries(map) as [keyof T, string][]) {
    const value = dto[from] as unknown as string | null | undefined;
    if (value === undefined) continue;
    out[to] = value ? new Date(value) : null;
  }
  return out;
}

/** Entries keep what the portal stores besides (degree name, dates, language). */
export function mergeSchools(
  current: Record<string, any>[],
  entries: CrmEducationDto[],
): Record<string, any>[] {
  return entries.map((e) => {
    const index = /^school:(\d+)$/.exec(e.id ?? '')?.[1];
    const base = index === undefined ? {} : (current[Number(index)] ?? {});
    const sameYear = yearOf(base.to) === (e.graduationYear ?? null);
    return {
      ...base,
      educationLevel: e.level.trim(),
      schoolName: e.institution?.trim() ?? '',
      country: e.country?.trim() ?? '',
      gradeAverage: e.gpa?.trim() ?? '',
      gradeScaleOutOf: e.gpaScale?.trim() ?? '',
      to: sameYear ? (base.to ?? '') : String(e.graduationYear ?? ''),
    };
  });
}

/** Scores for tests that are listed; the others are cleared, other keys stay. */
export function mergeScores(
  current: unknown,
  tests: CrmTestDto[],
): Record<string, any> {
  const out: Record<string, any> =
    current && typeof current === 'object' && !Array.isArray(current)
      ? { ...(current as Record<string, any>) }
      : {};
  for (const name of STUDENT_TESTS) {
    delete out[name.toLowerCase()];
    delete out[`${name.toLowerCase()}Date`];
  }
  for (const t of tests) {
    const name = t.test.trim().toUpperCase();
    if (!STUDENT_TESTS.includes(name)) {
      throw new InvalidDataException(`Unknown test ${t.test}`);
    }
    out[name.toLowerCase()] = t.score.trim();
    if (t.date) out[`${name.toLowerCase()}Date`] = t.date.slice(0, 10);
  }
  return out;
}

function studentTests(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const scores = value as Record<string, unknown>;
  return STUDENT_TESTS.filter((t) => text(scores[t.toLowerCase()])).map(
    (t) => ({
      id: t,
      test: t,
      score: text(scores[t.toLowerCase()]),
      date: text(scores[`${t.toLowerCase()}Date`]),
    }),
  );
}

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

const yearOf = (value: unknown): number | null =>
  Number(/\d{4}/.exec(String(value ?? ''))?.[0]) || null;

const text = (value: unknown): string | null =>
  value === null || value === undefined || String(value).trim() === ''
    ? null
    : String(value).trim();

const fullName = (
  p: { firstName: string | null; lastName: string | null } | null | undefined,
) => [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim();
