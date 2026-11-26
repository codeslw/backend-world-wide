import { Injectable, Logger } from '@nestjs/common';
import {
  IntakeSeason,
  MiniApplicationStatus,
  PartnerApplicationStatus,
  Prisma,
} from '@prisma/client';
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

/**
 * The admin team's own organization (migration 20261125121000): applicants that
 * staff add in edu-crm are kept as its students.
 */
export const CRM_ORGANIZATION_ID = '00000000-0000-4000-8000-00000000c001';

const STATUSES = new Set<string>(Object.values(PartnerApplicationStatus));
const SEASONS = new Set<string>(Object.values(IntakeSeason));
const MINI_STATUSES = new Set<string>(Object.values(MiniApplicationStatus));
const REVIEWED = new Set<string>(['ACCEPTED', 'REJECTED', 'CONDITIONAL_OFFER']);

const ENTITIES = ['applicant', 'application', 'mini_application'];

/**
 * Applies edu-crm applicants, applications and mini applications here. The CRM
 * and this service share ids, so an event is an upsert of the row with the same
 * id: a partner student or a client's profile, an application of either kind.
 *
 * Both systems change the same records, so a group of fields is taken only when
 * the CRM changed it later than this service did (`statusChangedAt`,
 * `detailsChangedAt`); otherwise our state is sent back so both agree.
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
    if (!ENTITIES.includes(event.entity)) {
      this.logger.warn(`Ignoring unknown CRM entity "${event.entity}"`);
      return false;
    }
    if (event.deleted || !event.data) {
      // The CRM doesn't delete records yet.
      this.logger.warn(`Ignoring ${event.entity} tombstone ${event.id}`);
      return false;
    }
    const data = event.data;
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('ww.origin', 'crm', true)`;
      switch (event.entity) {
        case 'applicant':
          return data.kind === 'client'
            ? this.applyClient(tx, event.id, data)
            : this.applyStudent(tx, event.id, data);
        case 'application':
          return data.kind === 'client'
            ? this.applyClientApplication(tx, event.id, data)
            : this.applyPartnerApplication(tx, event.id, data);
        default:
          return this.applyMiniApplication(tx, event.id, data);
      }
    });
  }

  /** Sends our current state of a record to the CRM, which has an older one. */
  private async sendBack(
    tx: Prisma.TransactionClient,
    entity: string,
    entityId: string,
  ) {
    await tx.catalogOutbox.create({ data: { entity, entityId } });
  }

  // ── Applicants ─────────────────────────────────────────────────────────────

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
    const org = await tx.partnerOrganization.findUnique({
      where: { id: organizationId ?? CRM_ORGANIZATION_ID },
      select: { ownerId: true },
    });
    if (org) return org.ownerId;
    throw new Error(
      `No partner found for organization ${organizationId ?? '(none)'}`,
    );
  }

  private async applyStudent(
    tx: Prisma.TransactionClient,
    id: string,
    data: Record<string, any>,
  ): Promise<boolean> {
    // Phone and email are left out of the event when the CRM has none, so an
    // absent key means "no change" and never erases what is stored here.
    const fields = {
      firstName: str(data.firstName) ?? STUB_NAME,
      lastName: str(data.lastName) ?? STUB_NAME,
      ...(str(data.middleName) !== undefined && {
        middleName: str(data.middleName),
      }),
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

  /** Contacts of a client account: they live on the profile. */
  private async applyClient(
    tx: Prisma.TransactionClient,
    userId: string,
    data: Record<string, any>,
  ): Promise<boolean> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true, profile: { select: { id: true } } },
    });
    if (!user || user.role !== 'CLIENT') {
      this.logger.warn(`Ignoring contacts of ${userId}: not a client account`);
      return false;
    }
    const email = str(data.email);
    const fields = {
      ...(str(data.firstName) !== undefined && {
        firstName: str(data.firstName),
      }),
      ...(str(data.lastName) !== undefined && { lastName: str(data.lastName) }),
      ...(str(data.middleName) !== undefined && {
        middleName: str(data.middleName),
      }),
      ...(str(data.phone) !== undefined && { phoneNumber: str(data.phone) }),
      // The sign-in email is the account's; the profile holds another contact address.
      ...(email !== undefined && email !== user.email && { email }),
    };
    if (Object.keys(fields).length === 0) return false;
    await tx.profile.upsert({
      where: { userId },
      update: fields,
      create: { userId, ...fields },
    });
    return true;
  }

  // ── Applications ───────────────────────────────────────────────────────────

  private async program(
    tx: Prisma.TransactionClient,
    data: Record<string, any>,
  ): Promise<{ id: string; countryCode: number }> {
    const program = await tx.universityProgram.findFirst({
      where: { id: data.programId, universityId: data.universityId },
      select: { id: true, university: { select: { countryCode: true } } },
    });
    if (!program) {
      // The catalog may not have reached this service's database yet.
      throw new Error(
        `Program ${data.programId} of university ${data.universityId} not found`,
      );
    }
    return {
      id: program.id,
      countryCode: program.university?.countryCode,
    };
  }

  private async applyPartnerApplication(
    tx: Prisma.TransactionClient,
    id: string,
    data: Record<string, any>,
  ): Promise<boolean> {
    const status = statusOf(data);
    const studentId = String(data.applicantId ?? '');
    const program = await this.program(tx, data);
    const intake = intakeOf(data);

    const existing = await tx.partnerApplication.findUnique({
      where: { id },
      select: {
        id: true,
        origin: true,
        createdByAdminId: true,
        status: true,
        statusChangedAt: true,
        detailsChangedAt: true,
        partner: {
          select: { partnerOrganization: { select: { id: true } } },
        },
        partnerStudent: { select: { firstName: true, lastName: true } },
      },
    });
    if (existing) {
      const take = newerGroups(existing, status, data);
      if (take.sendBack) await this.sendBack(tx, 'partner_application', id);
      await tx.partnerApplication.update({
        where: { id },
        data: {
          ...(take.status && statusFields(status, data)),
          ...(take.status &&
            REVIEWED.has(status) &&
            status !== existing.status && { reviewedAt: new Date() }),
          ...(take.details && {
            universityId: data.universityId as string,
            programId: program.id,
            ...intake,
            ...changedAt('detailsChangedAt', data.detailsChangedAt),
          }),
          // Notes are the agency's: the CRM keeps its own and sends none.
          ...(data.notes !== undefined && { notes: str(data.notes) ?? null }),
          visaStatus: visaOf(data),
          ...tracking(data),
          ...correctedOrigin(data, existing.origin, existing.createdByAdminId),
        },
      });
      if (take.status && status !== existing.status) {
        await tx.partnerAuditLog.create({
          data: {
            action: 'APPLICATION_STATUS_CHANGED',
            actorRole: 'ADMIN',
            actorName: str(data.changedByName) ?? 'edu-crm',
            organizationId: existing.partner?.partnerOrganization?.id ?? null,
            targetType: 'PartnerApplication',
            targetId: id,
            targetLabel: existing.partnerStudent
              ? `${existing.partnerStudent.firstName} ${existing.partnerStudent.lastName}`.trim()
              : id,
            metadata: { from: existing.status, to: status, via: 'edu-crm' },
          },
        });
      }
      return true;
    }

    if (!intake) {
      // world-wide needs an intake to hold the application; the CRM sends it
      // again once one is chosen.
      this.logger.log(`Application ${id} has no intake yet, not creating it`);
      return false;
    }
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
    await tx.partnerApplication.create({
      data: {
        id,
        partnerId: student.partnerId,
        partnerStudentId: student.id,
        universityId: data.universityId,
        programId: program.id,
        ...intake,
        ...statusFields(status, data),
        ...changedAt('detailsChangedAt', data.detailsChangedAt),
        notes: str(data.notes) ?? null,
        visaStatus: visaOf(data),
        origin: 'CRM',
        ...tracking(data),
      },
    });
    return true;
  }

  private async applyClientApplication(
    tx: Prisma.TransactionClient,
    id: string,
    data: Record<string, any>,
  ): Promise<boolean> {
    const status = statusOf(data);
    const program = await this.program(tx, data);
    const intake = intakeOf(data);
    const details = {
      preferredUniversity: data.universityId as string,
      preferredProgram: program.id,
      preferredCountry: String(program.countryCode ?? ''),
    };

    const existing = await tx.application.findUnique({
      where: { id },
      select: { status: true, statusChangedAt: true, detailsChangedAt: true },
    });
    if (existing) {
      const take = newerGroups(existing, status, data);
      if (take.sendBack) await this.sendBack(tx, 'client_application', id);
      await tx.application.update({
        where: { id },
        data: {
          ...(take.status && statusFields(status, data)),
          ...(take.details && {
            ...details,
            ...intake,
            ...changedAt('detailsChangedAt', data.detailsChangedAt),
          }),
          visaStatus: visaOf(data),
          ...tracking(data),
        },
      });
      return true;
    }
    if (!intake) {
      this.logger.log(`Application ${id} has no intake yet, not creating it`);
      return false;
    }
    const profile = await tx.profile.findUnique({
      where: { userId: String(data.applicantId ?? '') },
      select: { id: true },
    });
    if (!profile) {
      throw new Error(`Client ${data.applicantId} has no profile yet`);
    }
    await tx.application.create({
      data: {
        id,
        profileId: profile.id,
        ...details,
        ...intake,
        ...statusFields(status, data),
        ...changedAt('detailsChangedAt', data.detailsChangedAt),
        visaStatus: visaOf(data),
        origin: 'CRM',
        ...tracking(data),
      },
    });
    return true;
  }

  // ── Mini applications ──────────────────────────────────────────────────────

  /** Progress the CRM made on a request; the request itself is ours. */
  private async applyMiniApplication(
    tx: Prisma.TransactionClient,
    id: string,
    data: Record<string, any>,
  ): Promise<boolean> {
    const status = String(data.status ?? '');
    if (!MINI_STATUSES.has(status))
      throw new Error(`Unknown mini application status "${status}"`);
    const existing = await tx.miniApplication.findUnique({
      where: { id },
      select: { status: true, statusChangedAt: true },
    });
    if (!existing) return false; // deleted here meanwhile
    const theirs = dateOf(data.statusChangedAt);
    const newer = !theirs || theirs >= existing.statusChangedAt;
    if (!newer && status !== existing.status) {
      await this.sendBack(tx, 'mini_application', id);
    }
    await tx.miniApplication.update({
      where: { id },
      data: {
        ...(newer && {
          status: status as MiniApplicationStatus,
          ...changedAt('statusChangedAt', data.statusChangedAt),
        }),
        ...tracking(data),
      },
    });
    return true;
  }
}

/**
 * Which groups of fields to take from the CRM: the later change wins, group by
 * group (status, details). Both systems apply this same rule, so they settle
 * on the same state; a rule only one side applied (say, "a closed application
 * stays closed") would make them send the record back and forth for ever.
 * Neither side's users can reopen a closed application or go back to a draft,
 * so only a later, deliberate change can. `sendBack` is set when the CRM is
 * the one that is behind.
 */
export function newerGroups(
  existing: { status: string; statusChangedAt: Date; detailsChangedAt: Date },
  status: string,
  data: Record<string, any>,
): { status: boolean; details: boolean; sendBack: boolean } {
  const statusAt = dateOf(data.statusChangedAt);
  const detailsAt = dateOf(data.detailsChangedAt);
  const takeStatus = !statusAt || statusAt >= existing.statusChangedAt;
  const takeDetails = !detailsAt || detailsAt >= existing.detailsChangedAt;
  return {
    status: takeStatus,
    details: takeDetails,
    sendBack: (!takeStatus && status !== existing.status) || !takeDetails,
  };
}

function statusOf(data: Record<string, any>): PartnerApplicationStatus {
  const status = String(data.status ?? '');
  if (!STATUSES.has(status)) throw new Error(`Unknown status "${status}"`);
  return status as PartnerApplicationStatus;
}

function statusFields(
  status: PartnerApplicationStatus,
  data: Record<string, any>,
) {
  return {
    status,
    stage: normalizeStage(
      status,
      Number.isInteger(data.stage) ? data.stage : null,
    ),
    ...(dateOf(data.submittedAt) && { submittedAt: dateOf(data.submittedAt) }),
    ...(status === 'REJECTED' &&
      str(data.rejectionReason) !== undefined && {
        rejectionReason: str(data.rejectionReason),
      }),
    ...changedAt('statusChangedAt', data.statusChangedAt),
  };
}

/** Keeps the CRM's change time, so a later comparison is between like and like. */
function changedAt<K extends string>(
  key: K,
  value: unknown,
): Partial<Record<K, Date>> {
  const date = dateOf(value);
  return date ? ({ [key]: date } as Partial<Record<K, Date>>) : {};
}

function intakeOf(data: Record<string, any>) {
  if (!SEASONS.has(data.intakeSeason) || !Number.isInteger(data.intakeYear)) {
    return null;
  }
  return {
    intakeSeason: data.intakeSeason as IntakeSeason,
    intakeYear: data.intakeYear as number,
    intakeId: str(data.intakeId) ?? null,
  };
}

const VISA = new Set(['PREPARING', 'SUBMITTED', 'APPROVED', 'REFUSED']);

function visaOf(data: Record<string, any>): string | null {
  const visa = String(data.visaStatus ?? '').toUpperCase();
  return VISA.has(visa) ? visa : null;
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

function dateOf(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** A trimmed non-empty string, or undefined. */
function str(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}
