import { PartnerApplicationStatus as S } from '@prisma/client';
import {
  allowedNextStatuses,
  checkStatusTransition,
} from './partner-applications.service';

describe('checkStatusTransition (same rule as edu-crm CheckTransition)', () => {
  it.each([
    [S.SUBMITTED, S.UNDER_REVIEW],
    [S.UNDER_REVIEW, S.DOCUMENTS_REQUIRED],
    [S.DOCUMENTS_REQUIRED, S.SUBMITTED],
    [S.UNDER_REVIEW, S.CONDITIONAL_OFFER],
    [S.CONDITIONAL_OFFER, S.ACCEPTED],
    [S.ACCEPTED, S.ENROLLED],
    [S.DRAFT, S.SUBMITTED],
    [S.DRAFT, S.WITHDRAWN],
  ])('allows %s → %s', (from, to) => {
    expect(checkStatusTransition(from, to)).toBeNull();
  });

  it.each([
    [S.SUBMITTED, S.SUBMITTED],
    [S.ENROLLED, S.ACCEPTED],
    [S.REJECTED, S.UNDER_REVIEW],
    [S.WITHDRAWN, S.SUBMITTED],
    [S.UNDER_REVIEW, S.DRAFT],
    [S.DRAFT, S.ACCEPTED],
  ])('refuses %s → %s', (from, to) => {
    expect(checkStatusTransition(from, to)).not.toBeNull();
  });

  it('offers nothing from a final status', () => {
    expect(allowedNextStatuses(S.ENROLLED)).toEqual([]);
    expect(allowedNextStatuses(S.REJECTED)).toEqual([]);
  });

  it('lets an accepted application be enrolled', () => {
    expect(allowedNextStatuses(S.ACCEPTED)).toContain(S.ENROLLED);
  });
});
