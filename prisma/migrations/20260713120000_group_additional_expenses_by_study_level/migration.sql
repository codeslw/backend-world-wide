-- Data migration: convert University.additionalExpenses from the legacy flat
-- shape to the study-level-grouped shape.
--
--   before: [{ "label": ..., "amount": ... }]
--   after:  [{ "studyLevel": "BACHELOR", "expenses": [{ "label": ..., "amount": ... }] }]
--
-- Only rows still in the legacy flat shape are rewritten: a JSON array whose
-- first element is an object that has neither an `expenses` key nor a
-- `studyLevel` key. Already-grouped rows, empty arrays, and non-array values
-- are left untouched, so this migration is idempotent.

UPDATE "universities"
SET "additionalExpenses" = jsonb_build_array(
  jsonb_build_object(
    'studyLevel', 'BACHELOR',
    'expenses', "additionalExpenses"
  )
)
WHERE jsonb_typeof("additionalExpenses"::jsonb) = 'array'
  AND jsonb_array_length("additionalExpenses"::jsonb) > 0
  AND jsonb_typeof("additionalExpenses"::jsonb -> 0) = 'object'
  AND NOT ("additionalExpenses"::jsonb -> 0 ? 'expenses')
  AND NOT ("additionalExpenses"::jsonb -> 0 ? 'studyLevel');
