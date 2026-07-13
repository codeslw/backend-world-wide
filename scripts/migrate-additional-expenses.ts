/**
 * One-off data migration: convert University.additionalExpenses from the legacy
 * flat shape to the study-level-grouped shape.
 *
 *   before: [{ label, amount }]
 *   after:  [{ studyLevel: 'BACHELOR', expenses: [{ label, amount }] }]
 *
 * Rows already in the grouped shape (items containing an `expenses` array) are
 * left untouched, so this script is idempotent and safe to re-run.
 *
 * Run: npx ts-node scripts/migrate-additional-expenses.ts
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_STUDY_LEVEL = 'BACHELOR';

type FlatExpense = { label?: string; amount?: string };
type GroupedExpense = { studyLevel?: string; expenses?: FlatExpense[] };

function isGrouped(arr: any[]): boolean {
  // Grouped items carry an `expenses` array (and/or a `studyLevel`).
  return arr.some(
    (item) =>
      item &&
      typeof item === 'object' &&
      (Array.isArray(item.expenses) || 'studyLevel' in item),
  );
}

async function main() {
  const universities = await prisma.university.findMany({
    select: { id: true, name: true, additionalExpenses: true },
  });

  let migrated = 0;
  let skipped = 0;

  for (const uni of universities) {
    const raw = uni.additionalExpenses as unknown;

    if (!Array.isArray(raw) || raw.length === 0) {
      skipped++;
      continue;
    }

    if (isGrouped(raw)) {
      skipped++;
      continue;
    }

    // Legacy flat shape -> group under the default study level.
    const flat = (raw as FlatExpense[]).filter((e) => e?.label || e?.amount);
    if (flat.length === 0) {
      skipped++;
      continue;
    }

    const grouped: GroupedExpense[] = [
      { studyLevel: DEFAULT_STUDY_LEVEL, expenses: flat },
    ];

    await prisma.university.update({
      where: { id: uni.id },
      data: {
        additionalExpenses: grouped as unknown as Prisma.InputJsonValue,
      },
    });

    migrated++;
    console.log(`migrated: ${uni.name} (${flat.length} expense(s))`);
  }

  console.log(
    `\nDone. Migrated ${migrated} university(ies), skipped ${skipped}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
