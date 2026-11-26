import {
  ApplicationStatus,
  IntakeSeason,
  PartnerApplicationStatus,
  Prisma,
} from '@prisma/client';

const FINAL_STATUSES = new Set<PartnerApplicationStatus>([
  PartnerApplicationStatus.ENROLLED,
  PartnerApplicationStatus.REJECTED,
  PartnerApplicationStatus.WITHDRAWN,
]);

/**
 * Why a status change is not allowed, or null when it is. Same rule as
 * edu-crm's CheckTransition: final statuses stay final, nothing goes back to
 * draft, and a draft can only be submitted or withdrawn.
 */
export function checkStatusTransition(
  from: PartnerApplicationStatus,
  to: PartnerApplicationStatus,
): string | null {
  if (from === to) return `The application is already ${to}`;
  if (FINAL_STATUSES.has(from)) {
    return `The application is ${from}, a final status`;
  }
  if (to === PartnerApplicationStatus.DRAFT) {
    return 'An application cannot go back to DRAFT';
  }
  if (
    from === PartnerApplicationStatus.DRAFT &&
    to !== PartnerApplicationStatus.SUBMITTED &&
    to !== PartnerApplicationStatus.WITHDRAWN
  ) {
    return 'A draft can only be submitted or withdrawn';
  }
  return null;
}

/** The statuses an admin can move an application to from `from`. */
export function allowedNextStatuses(
  from: PartnerApplicationStatus,
): PartnerApplicationStatus[] {
  return Object.values(PartnerApplicationStatus).filter(
    (to) => checkStatusTransition(from, to) === null,
  );
}

/** A status as the API takes it: the shared nine, or the older APPROVED. */
export function canonicalStatus(
  status: PartnerApplicationStatus | ApplicationStatus | string,
): PartnerApplicationStatus {
  return (
    status === 'APPROVED' ? 'ACCEPTED' : status
  ) as PartnerApplicationStatus;
}

/** Every value `PUT .../status` accepts. */
export const ACCEPTED_STATUS_VALUES: string[] = [
  ...Object.values(PartnerApplicationStatus),
  'APPROVED',
];

/**
 * The program's intake an application is for. Season and year are enough when
 * the program has one such intake; with several, only an explicit choice says
 * which.
 */
export async function resolveIntakeId(
  db: Prisma.TransactionClient,
  programId: string,
  season: IntakeSeason,
  year: number,
  chosen?: string | null,
): Promise<string | null> {
  const offered = await db.intake.findMany({
    where: {
      season,
      year,
      universityPrograms: { some: { universityProgramId: programId } },
    },
    select: { id: true },
  });
  if (chosen && offered.some((i) => i.id === chosen)) return chosen;
  return offered.length === 1 ? offered[0].id : null;
}
