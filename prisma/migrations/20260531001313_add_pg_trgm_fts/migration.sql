-- Enable pg_trgm extension for trigram similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram index on university name
CREATE INDEX IF NOT EXISTS idx_university_name_trgm
  ON "universities" USING GIN (name gin_trgm_ops);

-- GIN trigram indexes on program titles
CREATE INDEX IF NOT EXISTS idx_program_title_en_trgm
  ON "programs" USING GIN ("titleEn" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_program_title_ru_trgm
  ON "programs" USING GIN ("titleRu" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_program_title_uz_trgm
  ON "programs" USING GIN ("titleUz" gin_trgm_ops);
