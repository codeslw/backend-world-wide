import { IntakeSeason } from '@prisma/client';

/**
 * Pure, unit-testable helpers for intake season / start-month / deadline logic.
 *
 * Shared by:
 *  - CreateIntakeDto default application (IntakesService.create)
 *  - inline find-or-create when configuring university programs
 *  - the daily expiry + rollover cron
 *
 * All dates are computed in UTC so the same wall-clock month/day is produced
 * regardless of server timezone.
 */

/** The first (default) start month for each season, 1-12. */
export const SEASON_START_MONTH: Record<IntakeSeason, number> = {
  [IntakeSeason.SPRING]: 3, // March
  [IntakeSeason.SUMMER]: 6, // June
  [IntakeSeason.FALL]: 9, // September
  [IntakeSeason.WINTER]: 12, // December
};

const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
];

/** Number of months before the start month that the deadline defaults to. */
export const DEADLINE_MONTHS_BEFORE_START = 2;

/** True when n is an integer in 1..12. */
export function isValidMonth(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 12;
}

/** Canonical uppercase month name for a 1-12 month number. */
export function monthNumberToName(month: number): string {
  if (!isValidMonth(month)) {
    throw new Error(`Invalid month number: ${month}`);
  }
  return MONTH_NAMES[month - 1];
}

/** The default start month for a season (its first month). */
export function defaultStartMonth(season: IntakeSeason): number {
  return SEASON_START_MONTH[season];
}

/**
 * The concrete start date of an intake: the 1st of `startMonth` in `year`, UTC.
 */
export function intakeStartDate(startMonth: number, year: number): Date {
  if (!isValidMonth(startMonth)) {
    throw new Error(`Invalid start month: ${startMonth}`);
  }
  return new Date(Date.UTC(year, startMonth - 1, 1, 0, 0, 0, 0));
}

/**
 * Default application deadline: the 1st of the month `DEADLINE_MONTHS_BEFORE_START`
 * months before the start month, in the correct (possibly previous) year, UTC.
 *
 * e.g. startMonth=10 (October), year=2026 -> 2026-08-01
 *      startMonth=9  (September), year=2026 -> 2026-07-01
 *      startMonth=1  (January), year=2026 -> 2025-11-01 (wraps the year)
 */
export function defaultDeadline(startMonth: number, year: number): Date {
  if (!isValidMonth(startMonth)) {
    throw new Error(`Invalid start month: ${startMonth}`);
  }
  // JS Date normalizes negative month indices across the year boundary.
  const zeroBasedStart = startMonth - 1;
  return new Date(
    Date.UTC(year, zeroBasedStart - DEADLINE_MONTHS_BEFORE_START, 1, 0, 0, 0, 0),
  );
}

/**
 * Validation predicate: a deadline must be strictly before the intake start.
 */
export function isDeadlineBeforeStart(
  deadline: Date,
  startMonth: number,
  year: number,
): boolean {
  return deadline.getTime() < intakeStartDate(startMonth, year).getTime();
}

/**
 * An intake is "fully expired" (safe to delete) when BOTH its application
 * deadline AND its start date are in the past. Such a row can be removed once
 * it also has no remaining program links.
 */
export function isIntakeFullyExpired(
  intake: { deadline: Date; startMonth: number; year: number },
  now: Date,
): boolean {
  const deadlinePassed = intake.deadline.getTime() < now.getTime();
  const startPassed =
    intakeStartDate(intake.startMonth, intake.year).getTime() < now.getTime();
  return deadlinePassed && startPassed;
}

/**
 * Config describing a single intake cycle. Used by rollover.
 */
export interface IntakeCycle {
  season: IntakeSeason;
  startMonth: number;
  year: number;
  deadline: Date;
}

/**
 * Given an expired intake, compute the next same-season cycle whose deadline is
 * still in the future. Manual month/day offsets on the start month and deadline
 * are preserved and shifted forward by whole years.
 *
 * If shifting by one year still lands on a past deadline (very stale intake), we
 * keep advancing the year until the deadline is in the future, so a program is
 * never rolled onto a cycle that is itself already closed.
 */
export function nextFutureCycle(
  intake: {
    season: IntakeSeason;
    startMonth: number;
    year: number;
    deadline: Date;
  },
  now: Date,
): IntakeCycle {
  let yearShift = 1;
  // Cap the search to avoid any pathological infinite loop.
  const MAX_SHIFT = 50;
  for (; yearShift <= MAX_SHIFT; yearShift++) {
    const year = intake.year + yearShift;
    const deadline = shiftDateByYears(intake.deadline, yearShift);
    if (deadline.getTime() >= now.getTime()) {
      return {
        season: intake.season,
        startMonth: intake.startMonth,
        year,
        deadline,
      };
    }
  }
  // Fallback (should be unreachable): furthest computed cycle.
  const year = intake.year + MAX_SHIFT;
  return {
    season: intake.season,
    startMonth: intake.startMonth,
    year,
    deadline: shiftDateByYears(intake.deadline, MAX_SHIFT),
  };
}

/** Shift a UTC date forward by whole years, preserving month/day/time. */
export function shiftDateByYears(date: Date, years: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear() + years,
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}
