DROP TABLE IF EXISTS "_ProgramToUniversity" CASCADE;
DROP TABLE IF EXISTS "programs" CASCADE;

CREATE TABLE "programs" (
  "id" TEXT NOT NULL,
  "titleUz" TEXT NOT NULL,
  "titleRu" TEXT NOT NULL,
  "titleEn" TEXT,
  "descriptionUz" TEXT,
  "descriptionRu" TEXT,
  "descriptionEn" TEXT,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_ProgramToUniversity" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_ProgramToUniversity_AB_unique" ON "_ProgramToUniversity"("A", "B");
CREATE INDEX "_ProgramToUniversity_B_index" ON "_ProgramToUniversity"("B");

ALTER TABLE "programs" ADD CONSTRAINT "programs_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_ProgramToUniversity" ADD CONSTRAINT "_ProgramToUniversity_A_fkey" FOREIGN KEY ("A") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProgramToUniversity" ADD CONSTRAINT "_ProgramToUniversity_B_fkey" FOREIGN KEY ("B") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE; 