-- CreateTable
CREATE TABLE "mini_applications" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mini_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mini_applications_universityId_idx" ON "mini_applications"("universityId");

-- CreateIndex
CREATE INDEX "mini_applications_email_idx" ON "mini_applications"("email");

-- AddForeignKey
ALTER TABLE "mini_applications" ADD CONSTRAINT "mini_applications_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "universities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
