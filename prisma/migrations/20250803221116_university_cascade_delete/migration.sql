-- DropForeignKey
ALTER TABLE "university_programs" DROP CONSTRAINT "university_programs_universityId_fkey";

-- AddForeignKey
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
