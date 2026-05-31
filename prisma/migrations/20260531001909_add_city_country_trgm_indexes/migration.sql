-- GIN trigram indexes on city name fields (backing city search OR clauses)
CREATE INDEX IF NOT EXISTS idx_city_name_en_trgm
  ON "City" USING GIN ("nameEn" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_city_name_ru_trgm
  ON "City" USING GIN ("nameRu" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_city_name_uz_trgm
  ON "City" USING GIN ("nameUz" gin_trgm_ops);

-- GIN trigram indexes on country name fields
CREATE INDEX IF NOT EXISTS idx_country_name_en_trgm
  ON "Country" USING GIN ("nameEn" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_country_name_ru_trgm
  ON "Country" USING GIN ("nameRu" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_country_name_uz_trgm
  ON "Country" USING GIN ("nameUz" gin_trgm_ops);
