-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_preferredProgram_fkey" FOREIGN KEY ("preferredProgram") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_preferredUniversity_fkey" FOREIGN KEY ("preferredUniversity") REFERENCES "universities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
