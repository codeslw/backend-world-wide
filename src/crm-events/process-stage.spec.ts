import { normalizeStage } from './process-stage';

// The same vectors as TestNormalizeStage in edu-crm: the two must agree.
describe('normalizeStage', () => {
  const cases: [string, number | null, number][] = [
    ['DRAFT', 1, 1],
    ['DRAFT', 3, 3],
    ['DRAFT', null, 2],
    ['DRAFT', 6, 2],
    ['DOCUMENTS_REQUIRED', 2, 3],
    ['SUBMITTED', 2, 4],
    ['UNDER_REVIEW', 7, 4],
    ['CONDITIONAL_OFFER', 4, 5],
    ['ACCEPTED', 5, 5],
    ['ACCEPTED', 6, 6],
    ['ACCEPTED', 3, 5],
    ['ENROLLED', 1, 7],
    ['REJECTED', 4, 4],
    ['WITHDRAWN', null, 2],
    ['WITHDRAWN', 9, 2],
  ];
  it.each(cases)('%s stage %s -> %s', (status, stage, want) => {
    expect(normalizeStage(status, stage)).toBe(want);
  });
});
