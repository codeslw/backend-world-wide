import { Prisma } from '@prisma/client';

/**
 * Builds the published (contract) shape of each catalog entity: the
 * `data` field of a `ww.catalog.v1` event. This is the public contract for
 * consumers such as edu-crm — keep it backward compatible: add fields freely,
 * but renaming or removing one requires a new `v2` subject.
 *
 * Returns `null` when the entity no longer exists (a tombstone is published)
 * and `undefined` for an unknown entity name.
 */
export async function loadCatalogSnapshot(
  db: Prisma.TransactionClient,
  entity: string,
  id: string,
): Promise<Record<string, unknown> | null | undefined> {
  switch (entity) {
    case 'country': {
      const code = Number(id);
      if (!Number.isInteger(code)) return null;
      return db.country.findUnique({
        where: { code },
        select: {
          code: true,
          nameEn: true,
          nameRu: true,
          nameUz: true,
          isMain: true,
          updatedAt: true,
        },
      });
    }
    case 'city':
      return db.city.findUnique({
        where: { id },
        select: {
          id: true,
          countryCode: true,
          nameEn: true,
          nameRu: true,
          nameUz: true,
          updatedAt: true,
        },
      });
    case 'university':
      return db.university.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          type: true,
          countryCode: true,
          cityId: true,
          address: true,
          website: true,
          email: true,
          phone: true,
          established: true,
          ranking: true,
          studentsCount: true,
          acceptanceRate: true,
          avgApplicationFee: true,
          applicationFeeCurrency: true,
          isAdmissionFeeRefundable: true,
          winterIntakeDeadline: true,
          autumnIntakeDeadline: true,
          logoUrl: true,
          photoUrl: true,
          isMain: true,
          isRecommended: true,
          hasScholarship: true,
          hasFullScholarship: true,
          canApplyWithoutLanguageCert: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    case 'faculty':
      return db.faculty.findUnique({
        where: { id },
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameRu: true,
          nameUz: true,
          sortOrder: true,
          isActive: true,
          updatedAt: true,
        },
      });
    case 'department':
      return db.department.findUnique({
        where: { id },
        select: {
          id: true,
          facultyId: true,
          slug: true,
          nameEn: true,
          nameRu: true,
          nameUz: true,
          sortOrder: true,
          isActive: true,
          updatedAt: true,
        },
      });
    case 'study_language':
      return db.studyLanguage.findUnique({
        where: { id },
        select: {
          id: true,
          nameEn: true,
          nameRu: true,
          nameUz: true,
          updatedAt: true,
        },
      });
    case 'intake':
      return db.intake.findUnique({
        where: { id },
        select: {
          id: true,
          season: true,
          startMonth: true,
          year: true,
          deadline: true,
          updatedAt: true,
        },
      });
    case 'program': {
      const program = await db.universityProgram.findUnique({
        where: { id },
        select: {
          id: true,
          universityId: true,
          title: true,
          slug: true,
          facultyId: true,
          departmentId: true,
          studyLanguageId: true,
          studyLevel: true,
          studyMode: true,
          duration: true,
          credits: true,
          tuitionFee: true,
          tuitionFeeType: true,
          tuitionFeeCurrency: true,
          scholarshipAppliedTutionFee: true,
          applicationFee: true,
          applicationFeeCurrency: true,
          isApplicationFeeRefundable: true,
          isActive: true,
          isFeatured: true,
          hasRollingIntakes: true,
          createdAt: true,
          updatedAt: true,
          intakes: { select: { intakeId: true }, orderBy: { intakeId: 'asc' } },
        },
      });
      if (!program) return null;
      const { intakes, scholarshipAppliedTutionFee, ...rest } = program;
      return {
        ...rest,
        // The column name has a typo; the contract spells it correctly.
        scholarshipAppliedTuitionFee: scholarshipAppliedTutionFee,
        intakeIds: intakes.map((i) => i.intakeId),
      };
    }
    default:
      return undefined;
  }
}
