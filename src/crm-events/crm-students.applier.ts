import { Injectable, Logger } from '@nestjs/common';
import { IntakeSeason, PartnerApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../db/prisma.service';
import { normalizeStage } from './process-stage';

/** Envelope of a `crm.student.v1` event (see docs/student-events.md). */
export interface CrmEvent {
  schema: string;
  entity: string;
  id: string;
  deleted: boolean;
  data: Record<string, any> | null;
}

/** Fills the required name columns of a student an application creates first. */
const STUB_NAME = '—';

const STATUSES = new Set<string>(Object.values(PartnerApplicationStatus));
const SEASONS = new Set<string>(Object.values(IntakeSeason));

/**
 * Applies edu-crm applicants and applications to partner_students and
 * partner_applications. The CRM and this service share ids, so an event is an
 * upsert of the row with the same id.
 *
 * Every write runs with `ww.origin = 'crm'`, which keeps the outbox triggers
 * from publishing the change back to the CRM.
 */
@Injectable()
export class CrmStudentsApplier {
  private readonly logger = new Logger(CrmStudentsApplier.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Returns false when the event was ignored. Throws to have it retried. */
  async apply(event: CrmEvent): Promise<boolean> {
    if (event.entity !== 'applicant' && event.entity !== 'application') {
      this.logger.warn(`Ignoring unknown CRM entity "${event.entity}"`);
      return false;
    }
    if (event.deleted || !event.data) {
      // The CRM doesn't delete applicants or applications yet.
      this.logger.warn(`Ignoring ${event.entity} tombstone ${event.id}`);
      return false;
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('ww.origin', 'crm', true)`;
      return event.entity === 'applicant'
        ? this.applyApplicant(tx, event.id, event.data!)
        : this.applyApplication(tx, event.id, event.data!);
    });
  }

  /**
   * The partner who owns a new student: the CRM user's world-wide account when
   * it is a partner, otherwise the owner of the organization.
   */
  private async resolvePartnerId(
    tx: Prisma.TransactionClient,
    organizationId: string | undefined,
    partnerUserId: string | undefined,
  ): Promise<string> {
    if (partnerUserId) {
      const user = await tx.user.findUnique({
        where: { id: partnerUserId },
        select: { id: true, role: true },
      });
      if (user?.role === 'PARTNER') return user.id;
    }
    if (organizationId) {
      const org = await tx.partnerOrganization.findUnique({
        where: { id: organizationId },
        select: { ownerId: true },
      });
      if (org) return org.ownerId;
    }
    throw new Error(
      `No partner found for organization ${organizationId ?? '(none)'}`,
    );
  }

  private async applyApplicant(
    tx: Prisma.TransactionClient,
    id: string,
    data: Record<string, any>,
  ): Promise<boolean> {
    // Phone and email are left out of the event when the CRM has none, so an
    // absent key means "no change" and never erases what is stored here.
    const fields = {
      firstName: str(data.firstName) ?? STUB_NAME,
      lastName: str(data.lastName) ?? STUB_NAME,
      ...(str(data.phone) !== undefined && { phone: str(data.phone) }),
      ...(str(data.email) !== undefined && { email: str(data.email) }),
      ...tracking(data),
    };
    const existing = await tx.partnerStudent.findUnique({
      where: { id },
      select: { id: true, origin: true },
    });
    if (existing) {
      await tx.partnerStudent.update({
        where: { id },
        data: { ...fields, ...correctedOrigin(data, existing.origin, null) },
      });
      return true;
    }
    const partnerId = await this.resolvePartnerId(
      tx,
      data.organizationId,
      data.partnerUserId,
    );
    await tx.partnerStudent.create({
      data: { id, partnerId, origin: 'CRM', ...fields },
    });
    return true;
  }

  private async applyApplication(
    tx: Prisma.TransactionClient,
    id: string,
    data: Record<string, any>,
  ): Promise<boolean> {
    const status = String(data.status ?? '');
    if (!STATUSES.has(status)) throw new Error(`Unknown status "${status}"`);
    const studentId = String(data.applicantId ?? '');

    // The applicant event normally arrives first; if it hasn't, create a stub
    // that it fills in later.
    let student = await tx.partnerStudent.findUnique({
      where: { id: studentId },
      select: { id: true, partnerId: true },
    });
    if (!student) {
      const partnerId = await this.resolvePartnerId(
        tx,
        data.organizationId,
        data.partnerUserId,
      );
      student = await tx.partnerStudent.create({
        data: {
          id: studentId,
          partnerId,
          origin: 'CRM',
          firstName: STUB_NAME,
          lastName: STUB_NAME,
        },
        select: { id: true, partnerId: true },
      });
    }

    const program = await tx.universityProgram.findFirst({
      where: { id: data.programId, universityId: data.universityId },
      select: { id: true },
    });
    if (!program) {
      // The catalog may not have reached this service's database yet.
      throw new Error(
        `Program ${data.programId} of university ${data.universityId} not found`,
      );
    }

    const season = SEASONS.has(data.intakeSeason)
      ? (data.intakeSeason as IntakeSeason)
      : undefined;
    const year = Number.isInteger(data.intakeYear)
      ? (data.intakeYear as number)
      : undefined;
    const fields = {
      status: status as PartnerApplicationStatus,
      stage: normalizeStage(
        status,
        Number.isInteger(data.stage) ? data.stage : null,
      ),
      notes: str(data.notes) ?? null,
      submittedAt: data.submittedAt ? new Date(data.submittedAt) : null,
      universityId: data.universityId as string,
      programId: program.id,
      ...(season && year && { intakeSeason: season, intakeYear: year }),
      ...tracking(data),
    };

    const existing = await tx.partnerApplication.findUnique({
      where: { id },
      select: { id: true, origin: true, createdByAdminId: true },
    });
    if (existing) {
      await tx.partnerApplication.update({
        where: { id },
        data: {
          ...fields,
          ...correctedOrigin(data, existing.origin, existing.createdByAdminId),
        },
      });
      return true;
    }
    if (!season || !year) {
      // world-wide needs an intake to hold the application; the CRM sends it
      // again once one is chosen.
      this.logger.log(`Application ${id} has no intake yet, not creating it`);
      return false;
    }
    await tx.partnerApplication.create({
      data: {
        id,
        partnerId: student.partnerId,
        partnerStudentId: student.id,
        universityId: data.universityId,
        programId: program.id,
        intakeSeason: season,
        intakeYear: year,
        status: fields.status,
        stage: fields.stage,
        notes: fields.notes,
        submittedAt: fields.submittedAt,
        origin: 'CRM',
        crmSyncedAt: fields.crmSyncedAt,
        crmAssigneeName: fields.crmAssigneeName,
      },
    });
    return true;
  }
}

/**
 * What the admin panel tracks of every CRM change: when it arrived and who
 * manages the record in the CRM (absent: nobody).
 */
function tracking(data: Record<string, any>) {
  return {
    crmSyncedAt: new Date(),
    crmAssigneeName: str(data.assigneeName) ?? null,
  };
}

/**
 * The CRM says where it got a record (`createdIn`). A record it received from
 * here was created in the portal or by the admin team, never in the CRM: the
 * 20261117 backfill labelled every record without a creation audit entry as
 * CRM, so this puts the right origin back when such a record is next sent.
 */
export function correctedOrigin(
  data: Record<string, any>,
  origin: string,
  createdByAdminId: string | null,
): { origin?: string } {
  if (data.createdIn !== 'worldwide' || origin !== 'CRM') return {};
  return { origin: createdByAdminId ? 'ADMIN' : 'PORTAL' };
}

/** A trimmed non-empty string, or undefined. */
function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}
