import {
  CRM_ORGANIZATION_ID,
  CrmStudentsApplier,
  newerGroups,
} from './crm-students.applier';

const T1 = new Date('2026-11-25T10:00:00.000Z');
const T2 = new Date('2026-11-25T11:00:00.000Z');

/** A Prisma stand-in recording writes; `existing` holds the rows that exist. */
function fakePrisma(
  existing: {
    student?: any;
    application?: any;
    client?: any;
    clientApplication?: any;
    mini?: any;
    program?: any;
  } = {},
) {
  const writes: Record<string, any[]> = {};
  const rec = (name: string) => (args: any) => {
    (writes[name] ??= []).push(args);
    return Promise.resolve({ id: args.data?.id ?? 'x', partnerId: 'partner-1' });
  };
  const find = (row: any) => () => Promise.resolve(row ?? null);
  const tx = {
    $executeRaw: () => Promise.resolve(0),
    user: {
      findUnique: ({ where }: any) =>
        Promise.resolve(
          where.id === 'client-1'
            ? existing.client ?? null
            : { id: where.id, role: 'PARTNER' },
        ),
    },
    partnerOrganization: {
      findUnique: (args: any) => {
        (writes['org.find'] ??= []).push(args);
        return Promise.resolve({ ownerId: 'owner-1' });
      },
    },
    universityProgram: {
      findFirst: find('program' in existing ? existing.program : { id: 'prog-1', university: { countryCode: 276 } }),
    },
    partnerStudent: {
      findUnique: find(existing.student),
      create: rec('student.create'),
      update: rec('student.update'),
    },
    partnerApplication: {
      findUnique: find(existing.application),
      create: rec('application.create'),
      update: rec('application.update'),
    },
    application: {
      findUnique: find(existing.clientApplication),
      create: rec('client.create'),
      update: rec('client.update'),
    },
    profile: {
      findUnique: () => Promise.resolve({ id: 'profile-1' }),
      upsert: rec('profile.upsert'),
    },
    miniApplication: {
      findUnique: find(existing.mini),
      update: rec('mini.update'),
    },
    partnerAuditLog: { create: rec('audit.create') },
    catalogOutbox: { create: rec('outbox.create') },
  };
  const prisma = { $transaction: (fn: any) => fn(tx) } as any;
  return { prisma, writes };
}

const application = {
  id: 'a1', kind: 'partner', applicantId: 's1', organizationId: 'org-1', partnerUserId: 'partner-1',
  universityId: 'u1', programId: 'prog-1', intakeSeason: 'FALL', intakeYear: 2027, intakeId: 'intake-1',
  status: 'SUBMITTED', stage: 4, assigneeName: 'Dilnoza K.',
  statusChangedAt: T2.toISOString(), detailsChangedAt: T2.toISOString(),
};
const stored = {
  id: 'a1', origin: 'PORTAL', createdByAdminId: null, status: 'SUBMITTED',
  statusChangedAt: T1, detailsChangedAt: T1, partner: null,
  partnerStudent: { firstName: 'Ali', lastName: 'Valiev' },
};

const send = (prisma: any, entity: string, id: string, data: any) =>
  new CrmStudentsApplier(prisma).apply({ schema: 'crm.student.v1', entity, id, deleted: false, data });

describe('CrmStudentsApplier tracking', () => {
  it('marks a new application as coming from the CRM, with its manager, sync time and exact intake', async () => {
    const { prisma, writes } = fakePrisma({ student: { id: 's1', partnerId: 'partner-1' } });
    await send(prisma, 'application', 'a1', application);
    const data = writes['application.create'][0].data;
    expect(data).toMatchObject({ origin: 'CRM', crmAssigneeName: 'Dilnoza K.', intakeId: 'intake-1', statusChangedAt: T2 });
    expect(data.crmSyncedAt).toBeInstanceOf(Date);
  });

  it('stamps every update and clears a removed manager, keeping the origin', async () => {
    const { prisma, writes } = fakePrisma({ application: stored });
    const { assigneeName: _, ...unassigned } = application;
    await send(prisma, 'application', 'a1', unassigned);
    const data = writes['application.update'][0].data;
    expect(data.crmAssigneeName).toBeNull();
    expect(data.crmSyncedAt).toBeInstanceOf(Date);
    expect(data.origin).toBeUndefined();
  });

  it('keeps an applicant added in the CRM under the admin team’s own organization', async () => {
    const { prisma, writes } = fakePrisma();
    await send(prisma, 'applicant', 's1', { id: 's1', kind: 'crm', firstName: 'Ali', lastName: 'Valiev', assigneeName: 'Dilnoza K.' });
    expect(writes['org.find'][0].where.id).toBe(CRM_ORGANIZATION_ID);
    expect(writes['student.create'][0].data).toMatchObject({ origin: 'CRM', crmAssigneeName: 'Dilnoza K.', firstName: 'Ali', partnerId: 'owner-1' });
  });

  it('never touches the agency’s notes unless the event carries them', async () => {
    const { prisma, writes } = fakePrisma({ application: stored });
    await send(prisma, 'application', 'a1', application);
    expect('notes' in writes['application.update'][0].data).toBe(false);
  });
});

describe('client accounts', () => {
  const client = { role: 'CLIENT', email: 'ali@x.test', profile: { id: 'profile-1' } };

  it('writes contacts to the profile and leaves the sign-in email alone', async () => {
    const { prisma, writes } = fakePrisma({ client });
    await send(prisma, 'applicant', 'client-1', { kind: 'client', firstName: 'Ali', phone: '+998901234567', email: 'ali@x.test' });
    expect(writes['profile.upsert'][0]).toMatchObject({
      where: { userId: 'client-1' },
      update: { firstName: 'Ali', phoneNumber: '+998901234567' },
    });
    expect('email' in writes['profile.upsert'][0].update).toBe(false);
  });

  it('ignores accounts that are not clients', async () => {
    const { prisma, writes } = fakePrisma({ client: { ...client, role: 'ADMIN' } });
    await expect(send(prisma, 'applicant', 'client-1', { kind: 'client', firstName: 'X' })).resolves.toBe(false);
    expect(writes['profile.upsert']).toBeUndefined();
  });

  it('creates a client application from the CRM and updates one by the newest change', async () => {
    const data = { ...application, kind: 'client', applicantId: 'client-1' };
    const created = fakePrisma({ client });
    await send(created.prisma, 'application', 'a1', data);
    expect(created.writes['client.create'][0].data).toMatchObject({
      profileId: 'profile-1', preferredProgram: 'prog-1', preferredCountry: '276', status: 'SUBMITTED', origin: 'CRM',
    });
    const updated = fakePrisma({ clientApplication: { status: 'SUBMITTED', statusChangedAt: T1, detailsChangedAt: T1 } });
    await send(updated.prisma, 'application', 'a1', { ...data, status: 'CONDITIONAL_OFFER', stage: 5 });
    expect(updated.writes['client.update'][0].data).toMatchObject({ status: 'CONDITIONAL_OFFER', stage: 5 });
  });
});

describe('both systems changed the same application', () => {
  it('a CRM edit made before our decision does not undo it, and ours is sent back', async () => {
    const { prisma, writes } = fakePrisma({ application: { ...stored, status: 'ACCEPTED', statusChangedAt: T2 } });
    await send(prisma, 'application', 'a1', { ...application, status: 'UNDER_REVIEW', statusChangedAt: T1.toISOString() });
    expect('status' in writes['application.update'][0].data).toBe(false);
    expect(writes['outbox.create'][0].data).toEqual({ entity: 'partner_application', entityId: 'a1' });
    expect(writes['audit.create']).toBeUndefined();
  });

  it('a later CRM decision is taken and leaves an audit entry', async () => {
    const { prisma, writes } = fakePrisma({ application: stored });
    await send(prisma, 'application', 'a1', { ...application, status: 'REJECTED', rejectionReason: 'GPA', changedByName: 'Dilnoza K.' });
    expect(writes['application.update'][0].data).toMatchObject({ status: 'REJECTED', rejectionReason: 'GPA' });
    expect(writes['audit.create'][0].data).toMatchObject({ actorName: 'Dilnoza K.', metadata: { from: 'SUBMITTED', to: 'REJECTED', via: 'edu-crm' } });
    expect(writes['outbox.create']).toBeUndefined();
  });

  it('the later change wins even over a closed status, so both systems settle on it', () => {
    const closed = { status: 'REJECTED', statusChangedAt: T1, detailsChangedAt: T1 };
    const later = { statusChangedAt: T2.toISOString(), detailsChangedAt: T2.toISOString() };
    expect(newerGroups(closed, 'UNDER_REVIEW', later)).toEqual({ status: true, details: true, sendBack: false });
    const rejectedLater = { ...closed, statusChangedAt: T2 };
    const earlier = { statusChangedAt: T1.toISOString(), detailsChangedAt: T1.toISOString() };
    expect(newerGroups(rejectedLater, 'UNDER_REVIEW', earlier)).toEqual({ status: false, details: true, sendBack: true });
  });

  it('several CRM moves that arrive as one are taken', () => {
    const draft = { status: 'DRAFT', statusChangedAt: T1, detailsChangedAt: T1 };
    expect(newerGroups(draft, 'UNDER_REVIEW', { statusChangedAt: T2.toISOString() })).toMatchObject({ status: true, sendBack: false });
  });

  it('each group of fields is judged by its own time', () => {
    const row = { status: 'SUBMITTED', statusChangedAt: T2, detailsChangedAt: T1 };
    const event = { statusChangedAt: T1.toISOString(), detailsChangedAt: T2.toISOString() };
    expect(newerGroups(row, 'SUBMITTED', event)).toEqual({ status: false, details: true, sendBack: false });
  });
});

describe('mini applications', () => {
  it('takes the CRM’s progress, unless ours is newer', async () => {
    const fresh = fakePrisma({ mini: { status: 'NEW', statusChangedAt: T1 } });
    await send(fresh.prisma, 'mini_application', 'm1', { status: 'CONTACTED', statusChangedAt: T2.toISOString(), assigneeName: 'D' });
    expect(fresh.writes['mini.update'][0].data).toMatchObject({ status: 'CONTACTED', crmAssigneeName: 'D' });
    const late = fakePrisma({ mini: { status: 'CLOSED', statusChangedAt: T2 } });
    await send(late.prisma, 'mini_application', 'm1', { status: 'CONTACTED', statusChangedAt: T1.toISOString() });
    expect('status' in late.writes['mini.update'][0].data).toBe(false);
    expect(late.writes['outbox.create'][0].data.entity).toBe('mini_application');
  });

  it('ignores a request deleted here', async () => {
    const { prisma } = fakePrisma();
    await expect(send(prisma, 'mini_application', 'm1', { status: 'CLOSED' })).resolves.toBe(false);
  });
});

describe('correctedOrigin', () => {
  const { correctedOrigin } = jest.requireActual('./crm-students.applier');

  it('relabels a CRM-labelled record the CRM received from world-wide', () => {
    expect(correctedOrigin({ createdIn: 'worldwide' }, 'CRM', null)).toEqual({ origin: 'PORTAL' });
    expect(correctedOrigin({ createdIn: 'worldwide' }, 'CRM', 'admin-1')).toEqual({ origin: 'ADMIN' });
  });

  it('keeps records the CRM created, and older events without createdIn', () => {
    expect(correctedOrigin({ createdIn: 'crm' }, 'CRM', null)).toEqual({});
    expect(correctedOrigin({}, 'CRM', null)).toEqual({});
    expect(correctedOrigin({ createdIn: 'worldwide' }, 'PORTAL', null)).toEqual({});
  });
});
