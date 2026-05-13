-- CreateEnum
CREATE TYPE "PartnerRole" AS ENUM ('OWNER', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "PartnerAction" AS ENUM ('VIEW_STUDENTS', 'ADD_STUDENT', 'EDIT_STUDENT', 'DELETE_STUDENT', 'UPLOAD_DOCUMENTS', 'DELETE_DOCUMENTS', 'VIEW_APPLICATIONS', 'CREATE_APPLICATION', 'VIEW_APPLICATION_DETAIL', 'INVITE_MEMBERS', 'REMOVE_MEMBERS', 'EDIT_MEMBER_PERMISSIONS');

-- CreateTable
CREATE TABLE "partner_organizations" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PartnerRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_permissions" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "action" "PartnerAction" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "partner_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_organizations_ownerId_key" ON "partner_organizations"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_members_userId_key" ON "partner_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_permissions_memberId_action_key" ON "partner_permissions"("memberId", "action");

-- AddForeignKey
ALTER TABLE "partner_organizations" ADD CONSTRAINT "partner_organizations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_members" ADD CONSTRAINT "partner_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "partner_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_members" ADD CONSTRAINT "partner_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_permissions" ADD CONSTRAINT "partner_permissions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "partner_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
