-- CreateIndex
CREATE INDEX "universities_type_idx" ON "universities"("type");

-- CreateIndex
CREATE INDEX "universities_ranking_idx" ON "universities"("ranking");

-- CreateIndex
CREATE INDEX "universities_established_idx" ON "universities"("established");

-- CreateIndex
CREATE INDEX "universities_countryCode_idx" ON "universities"("countryCode");

-- CreateIndex
CREATE INDEX "universities_cityId_idx" ON "universities"("cityId");

-- CreateIndex
CREATE INDEX "universities_isMain_idx" ON "universities"("isMain");

-- CreateIndex
CREATE INDEX "university_programs_tuitionFee_idx" ON "university_programs"("tuitionFee");

-- CreateIndex
CREATE INDEX "university_programs_studyLevel_idx" ON "university_programs"("studyLevel");

-- CreateIndex
CREATE INDEX "university_programs_studyLanguage_idx" ON "university_programs"("studyLanguage");
