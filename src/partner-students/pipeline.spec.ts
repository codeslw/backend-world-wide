import { deriveCurrentStage } from './partner-students.service';

const app = (status: any, over: any = {}) => ({ status, stage: null, ...over });

describe('deriveCurrentStage', () => {
  it('follows the admission stage, not the status name', () => {
    expect(deriveCurrentStage([])).toBe('Created');
    expect(deriveCurrentStage([app('DRAFT')])).toBe('Ready to Apply');
    // Submitting is not an offer, and a request for documents is not a visa.
    expect(deriveCurrentStage([app('SUBMITTED')])).toBe('Ready to Apply');
    expect(deriveCurrentStage([app('DOCUMENTS_REQUIRED')])).toBe('Ready to Apply');
    expect(deriveCurrentStage([app('CONDITIONAL_OFFER')])).toBe('Offer Issued');
    expect(deriveCurrentStage([app('ACCEPTED')])).toBe('Offer Issued');
    expect(deriveCurrentStage([app('ACCEPTED', { stage: 6 })])).toBe('Ready for Visa');
    expect(deriveCurrentStage([app('ACCEPTED', { stage: 6, visaStatus: 'APPROVED' })])).toBe('Ready for Enrollment');
    expect(deriveCurrentStage([app('ENROLLED')])).toBe('Done');
  });

  it('takes the application that got furthest and ignores closed ones', () => {
    expect(deriveCurrentStage([app('SUBMITTED'), app('ACCEPTED')])).toBe('Offer Issued');
    expect(deriveCurrentStage([app('REJECTED', { stage: 5 }), app('DRAFT')])).toBe('Ready to Apply');
    expect(deriveCurrentStage([app('REJECTED', { stage: 5 })])).toBe('Created');
  });
});
