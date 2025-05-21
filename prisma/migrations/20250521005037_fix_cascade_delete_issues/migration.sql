-- DropForeignKey
ALTER TABLE "mini_applications" DROP CONSTRAINT "mini_applications_universityId_fkey";

-- DropForeignKey
ALTER TABLE "university_programs" DROP CONSTRAINT "university_programs_programId_fkey";

-- DropForeignKey
ALTER TABLE "university_programs" DROP CONSTRAINT "university_programs_universityId_fkey";

-- AddForeignKey
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "university_programs" ADD CONSTRAINT "university_programs_programId_fkey" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mini_applications" ADD CONSTRAINT "mini_applications_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
