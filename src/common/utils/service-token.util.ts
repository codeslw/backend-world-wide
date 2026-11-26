import { timingSafeEqual } from 'crypto';

export const SERVICE_TOKEN_HEADER = 'x-service-token';

/** Shortest service token accepted, so a weak or placeholder value can't be used. */
export const MIN_SERVICE_TOKEN_LENGTH = 32;

export function headerOf(req: any, name: string): string | undefined {
  const value = req?.headers?.[name];
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

/** Whether `token` is the configured edu-crm service token (constant time). */
export function isServiceToken(
  token: string | undefined,
  expected: string | undefined,
): boolean {
  if (!token || !expected || expected.length < MIN_SERVICE_TOKEN_LENGTH) {
    return false;
  }
  const left = Buffer.from(token);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
