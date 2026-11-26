/**
 * The seven steps of the admission process as edu-crm's team sees them:
 * 1 Консультация, 2 Выбор вуза, 3 Документы, 4 Подача, 5 Оффер, 6 Виза, 7 Готово.
 *
 * The status says what the university decided; the stage says where the case
 * stands in the partner's work. A status limits the stages it can sit in, and
 * both systems apply the same rule (internal/modules/applications/stage.go in
 * edu-crm) so they agree on the stage whatever order the changes arrive in.
 */
export const STAGE_COUNT = 7;

const DEFAULT_DRAFT_STAGE = 2; // a new application already has its university picked

/** The stages an application with this status can be in. */
export function stageRange(status: string): [number, number] {
  switch (status) {
    case 'DRAFT':
      return [1, 3];
    case 'DOCUMENTS_REQUIRED':
      return [3, 3];
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return [4, 4];
    case 'CONDITIONAL_OFFER':
      return [5, 5];
    case 'ACCEPTED':
      return [5, 6];
    case 'ENROLLED':
      return [7, 7];
    default:
      return [1, STAGE_COUNT]; // REJECTED, WITHDRAWN keep the stage they stopped at
  }
}

/** Brings a stage into the range its status allows; a missing one falls back to the status's natural stage. */
export function normalizeStage(
  status: string,
  stage: number | null | undefined,
): number {
  const [lo, hi] = stageRange(status);
  const value = stage ?? 0;
  if (value >= lo && value <= hi) return value;
  if (status === 'DRAFT') return DEFAULT_DRAFT_STAGE;
  if (status === 'REJECTED' || status === 'WITHDRAWN') {
    return value >= 1 && value <= STAGE_COUNT ? value : DEFAULT_DRAFT_STAGE;
  }
  return lo;
}

/**
 * The stage a step of a process template belongs to, by the status the step
 * maps to. Documents collected before submitting belong to Документы.
 */
export function stageForStatusKey(statusKey: string): number {
  const status = (statusKey ?? '').trim().toUpperCase();
  if (status === 'DRAFT') return 3;
  if (status === 'APPROVED') return 5;
  if (status === 'REJECTED' || status === 'WITHDRAWN') return 4;
  const [lo, hi] = stageRange(status);
  return lo === 1 && hi === STAGE_COUNT ? 4 : lo;
}
