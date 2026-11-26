import {
  buildChecklist,
  itemStatus,
  ProfileFile,
  ProgramRequirement,
  TemplateStep,
} from './checklist';

const type = (id: string, over: any = {}) => ({
  id,
  name: id,
  description: null,
  required: true,
  fileTypes: ['pdf'],
  maxSizeMb: 5,
  kind: null,
  ...over,
});
const step = (
  id: string,
  statusKey: string,
  order: number,
  docs: any[],
): TemplateStep => ({
  id,
  name: id,
  description: null,
  order,
  statusKey,
  isActive: true,
  requiredDocuments: docs,
});
const asks = (kind: any, over: Partial<ProgramRequirement> = {}) => ({
  kind,
  status: 'REQUIRED' as const,
  quantity: null,
  labelEn: null,
  labelRu: null,
  labelUz: null,
  notesEn: null,
  notesRu: null,
  notesUz: null,
  sortOrder: 0,
  ...over,
});
const file = (kind: any): ProfileFile => ({
  id: `f-${kind}`,
  source: 'student_document',
  kind,
  type: 'x',
  name: 'x.pdf',
  url: 'uploads/x.pdf',
  fileSize: 1,
  mimeType: 'application/pdf',
  expiresAt: null,
  createdAt: null,
});
const doc = (over: any) => ({
  documentTypeId: null,
  requirementKind: null,
  status: 'PENDING',
  ...over,
});

const STEPS = [
  step('lodge', 'SUBMITTED', 10, [type('t-passport', { kind: 'PASSPORT' })]),
  step('verify', 'DOCUMENTS_REQUIRED', 30, [
    type('t-transcript', { kind: 'TRANSCRIPT' }),
  ]),
  step('accept', 'ACCEPTED', 50, [type('t-deposit')]),
];

describe('buildChecklist', () => {
  it('lists a document the template and the program both ask for once', () => {
    const c = buildChecklist({
      steps: STEPS,
      program: [asks('PASSPORT', { notesRu: 'Действует 18 месяцев' })],
      documents: [],
      profileFiles: [],
    });
    const items = c.steps.flatMap((s) => s.requirements);
    expect(items.filter((i) => i.kind === 'PASSPORT')).toHaveLength(1);
    expect(items[0]).toMatchObject({
      key: 't-passport',
      askedBy: 'both',
      notes: { ru: 'Действует 18 месяцев' },
    });
  });

  it('adds what only the program asks for, before submitting', () => {
    const c = buildChecklist({
      steps: STEPS,
      program: [asks('CV'), asks('PHOTO', { status: 'OPTIONAL' })],
      documents: [],
      profileFiles: [],
    });
    expect(c.steps[0]).toMatchObject({ stepId: 'program', stage: 3 });
    expect(c.steps[0].requirements.map((r) => [r.key, r.required])).toEqual([
      ['kind:CV', true],
      ['kind:PHOTO', false],
    ]);
    expect(c.summary.required).toBe(4); // passport, transcript, deposit, CV
  });

  it('counts a file on the profile as provided, waiting for review', () => {
    const c = buildChecklist({
      steps: STEPS,
      program: [],
      documents: [],
      profileFiles: [file('PASSPORT'), file('OTHER')],
    });
    expect(c.steps[0].requirements[0]).toMatchObject({ status: 'PENDING' });
    expect(c.summary).toEqual({
      required: 3,
      uploaded: 1,
      approved: 0,
      rejected: 0,
    });
  });

  it('links uploads by document type or by kind and keeps the rest apart', () => {
    const byType = doc({ documentTypeId: 't-passport', status: 'APPROVED' });
    const byKind = doc({ requirementKind: 'TRANSCRIPT', status: 'REJECTED' });
    const loose = doc({});
    const c = buildChecklist({
      steps: STEPS,
      program: [],
      documents: [byType, byKind, loose],
      profileFiles: [],
    });
    const status = Object.fromEntries(
      c.steps.flatMap((s) => s.requirements).map((r) => [r.key, r.status]),
    );
    expect(status).toEqual({
      't-passport': 'APPROVED',
      't-transcript': 'REJECTED',
      't-deposit': 'MISSING',
    });
    expect(c.otherDocuments).toEqual([loose]);
  });

  it('places every step at its stage of the admission process', () => {
    const c = buildChecklist({
      steps: STEPS,
      program: [],
      documents: [],
      profileFiles: [],
    });
    expect(c.steps.map((s) => [s.stepId, s.stage])).toEqual([
      ['lodge', 4],
      ['verify', 3],
      ['accept', 5],
    ]);
  });

  it('an interview is a condition, not a document', () => {
    const c = buildChecklist({
      steps: [],
      program: [asks('INTERVIEW')],
      documents: [],
      profileFiles: [],
    });
    expect(c.interviewRequired).toBe(true);
    expect(c.steps).toEqual([]);
  });

  it('leaves out steps the admin switched off', () => {
    const c = buildChecklist({
      steps: [{ ...STEPS[0], isActive: false }],
      program: [],
      documents: [],
      profileFiles: [],
    });
    expect(c.steps).toEqual([]);
  });
});

describe('itemStatus', () => {
  it('an approved upload wins, a rejected one needs a new one', () => {
    expect(
      itemStatus([{ status: 'REJECTED' }, { status: 'APPROVED' }], false),
    ).toBe('APPROVED');
    expect(itemStatus([{ status: 'REJECTED' }], true)).toBe('REJECTED');
    expect(
      itemStatus([{ status: 'REJECTED' }, { status: 'PENDING' }], false),
    ).toBe('PENDING');
    expect(itemStatus([], true)).toBe('PENDING');
    expect(itemStatus([], false)).toBe('MISSING');
  });
});
