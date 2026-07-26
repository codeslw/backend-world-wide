import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { LanguageTestType } from '@prisma/client';

type ScoreRange = { min: number; max: number };

/**
 * Sane score bounds per accepted English test. `total` applies to `minTotal`,
 * `section` applies to the per-skill minimums (listening/reading/writing/
 * speaking), which are scored on a different scale for several tests.
 */
const LANGUAGE_TEST_RANGES: Record<
  LanguageTestType,
  { total: ScoreRange; section: ScoreRange }
> = {
  IELTS: { total: { min: 0, max: 9 }, section: { min: 0, max: 9 } },
  TOEFL_IBT: { total: { min: 0, max: 120 }, section: { min: 0, max: 30 } },
  TOEFL_PBT: { total: { min: 310, max: 677 }, section: { min: 31, max: 68 } },
  DUOLINGO: { total: { min: 10, max: 160 }, section: { min: 10, max: 160 } },
  PTE: { total: { min: 10, max: 90 }, section: { min: 10, max: 90 } },
  CAMBRIDGE: { total: { min: 80, max: 230 }, section: { min: 80, max: 230 } },
  TOEIC: { total: { min: 10, max: 990 }, section: { min: 5, max: 495 } },
};

export type LanguageTestScoreKind = 'total' | 'section';

/**
 * Validates a language-test score against the range of the sibling `test`
 * field on the same DTO (e.g. an IELTS minTotal may only be 0-9).
 */
export function IsWithinLanguageTestRange(
  kind: LanguageTestScoreKind,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isWithinLanguageTestRange',
      target: object.constructor,
      propertyName,
      constraints: [kind],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value === undefined || value === null) return true;
          if (typeof value !== 'number' || Number.isNaN(value)) return false;

          const test = (args.object as { test?: LanguageTestType }).test;
          // Nothing to compare against; @IsEnum on `test` reports that error.
          if (!test || !LANGUAGE_TEST_RANGES[test]) return true;

          const range = LANGUAGE_TEST_RANGES[test][args.constraints[0]];
          return value >= range.min && value <= range.max;
        },
        defaultMessage(args: ValidationArguments): string {
          const test = (args.object as { test?: LanguageTestType }).test;
          const range =
            test && LANGUAGE_TEST_RANGES[test]
              ? LANGUAGE_TEST_RANGES[test][args.constraints[0]]
              : null;
          return range
            ? `${args.property} for ${test} must be between ${range.min} and ${range.max}`
            : `${args.property} is outside the valid range for the selected test`;
        },
      },
    });
  };
}

export { LANGUAGE_TEST_RANGES };
