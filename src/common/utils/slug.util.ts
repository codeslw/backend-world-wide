/**
 * Slug helpers for public, SEO-facing URLs.
 *
 * Kept in sync with the SQL used by
 * prisma/migrations/20260726001000_backfill_program_hierarchy, so slugs
 * generated at runtime look identical to the ones produced by the backfill.
 */

/** Kebab-cases a title, dropping every character that is not a-z0-9. */
export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Titles written entirely in a non-Latin script reduce to an empty string;
  // the id suffix added by buildProgramSlug still makes those unique.
  return slug || 'program';
}

/**
 * Builds the public slug for a university program: kebab-cased title plus a
 * short id suffix, which keeps it readable while staying unique even for
 * duplicate titles within the same university.
 */
export function buildProgramSlug(title: string, id: string): string {
  return `${slugify(title)}-${id.slice(0, 8)}`;
}
