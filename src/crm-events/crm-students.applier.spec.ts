import { CrmStudentsApplier } from './crm-students.applier';

/** A Prisma stand-in recording writes; `existing` decides whether rows exist. */
function fakePrisma(existing: { student?: boolean; application?: boolean }) {
  const writes: Record<string, any[]> = {};
  const rec = (name: string) => (args: any) => {
    (writes[name] ??= []).push(args);
    return Promise.resolve({ id: args.data?.id ?? 'x', partnerId: 'partner-1' });
  };
  const tx = {
    $executeRaw: () => Promise.resolve(0),
    user: { findUnique: () => Promise.resolve({ id: 'partner-1', role: 'PARTNER' }) },
    partnerOrganization: { findUnique: () => Promise.resolve({ ownerId: 'owner-1' }) },
    universityProgram: { findFirst: () => Promise.resolve({ id: 'prog-1' }) },
    partnerStudent: {
      findUnique: () => Promise.resolve(existing.student ? { id: 's1', partnerId: 'partner-1' } : null),
      create: rec('student.create'),
      update: rec('student.update'),
    },
    partnerApplication: {
      findUnique: () => Promise.resolve(existing.application ? { id: 'a1' } : null),
      create: rec('application.create'),
      update: rec('application.update'),
    },
  };
  const prisma = { $transaction: (fn: any) => fn(tx) } as any;
  return { prisma, writes };
}

const application = {
  id: 'a1', applicantId: 's1', organizationId: 'org-1', partnerUserId: 'partner-1',
  universityId: 'u1', programId: 'prog-1', intakeSeason: 'FALL', intakeYear: 2027,
  status: 'SUBMITTED', stage: 4, assigneeName: 'Dilnoza K.',
};

describe('CrmStudentsApplier tracking', () => {
  it('marks a new application as coming from the CRM, with its manager and sync time', async () => {
    const { prisma, writes } = fakePrisma({ student: true });
    await new CrmStudentsApplier(prisma).apply({ schema: 'crm.student.v1', entity: 'application', id: 'a1', deleted: false, data: application });
    const data = writes['application.create'][0].data;
    expect(data.origin).toBe('CRM');
    expect(data.crmAssigneeName).toBe('Dilnoza K.');
    expect(data.crmSyncedAt).toBeInstanceOf(Date);
  });

  it('stamps every update and clears a removed manager, keeping the origin', async () => {
    const { prisma, writes } = fakePrisma({ student: true, application: true });
    const { assigneeName: _, ...unassigned } = application;
    await new CrmStudentsApplier(prisma).apply({ schema: 'crm.student.v1', entity: 'application', id: 'a1', deleted: false, data: unassigned });
    const data = writes['application.update'][0].data;
    expect(data.crmAssigneeName).toBeNull();
    expect(data.crmSyncedAt).toBeInstanceOf(Date);
    expect(data.origin).toBeUndefined();
  });

  it('marks a new student as coming from the CRM', async () => {
    const { prisma, writes } = fakePrisma({});
    await new CrmStudentsApplier(prisma).apply({
      schema: 'crm.student.v1', entity: 'applicant', id: 's1', deleted: false,
      data: { id: 's1', organizationId: 'org-1', firstName: 'Ali', lastName: 'Valiev', assigneeName: 'Dilnoza K.' },
    });
    const data = writes['student.create'][0].data;
    expect(data).toMatchObject({ origin: 'CRM', crmAssigneeName: 'Dilnoza K.', firstName: 'Ali' });
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
