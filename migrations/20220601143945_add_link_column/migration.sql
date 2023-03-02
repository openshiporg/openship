-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "canManageLinks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canSeeOtherLinks" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL,
    "filter" JSONB,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Link_shop" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Channel_links" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Link_user_idx" ON "Link"("user");

-- CreateIndex
CREATE UNIQUE INDEX "_Link_shop_AB_unique" ON "_Link_shop"("A", "B");

-- CreateIndex
CREATE INDEX "_Link_shop_B_index" ON "_Link_shop"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Channel_links_AB_unique" ON "_Channel_links"("A", "B");

-- CreateIndex
CREATE INDEX "_Channel_links_B_index" ON "_Channel_links"("B");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Link_shop" ADD FOREIGN KEY ("A") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Link_shop" ADD FOREIGN KEY ("B") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Channel_links" ADD FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Channel_links" ADD FOREIGN KEY ("B") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;
