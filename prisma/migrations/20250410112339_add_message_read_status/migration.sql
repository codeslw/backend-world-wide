-- CreateTable
CREATE TABLE "_MessageReads" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MessageReads_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_MessageReads_B_index" ON "_MessageReads"("B");

-- AddForeignKey
ALTER TABLE "_MessageReads" ADD CONSTRAINT "_MessageReads_A_fkey" FOREIGN KEY ("A") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MessageReads" ADD CONSTRAINT "_MessageReads_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
