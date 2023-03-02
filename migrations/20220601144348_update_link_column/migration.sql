/*
  Warnings:

  - You are about to drop the `_Channel_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_Link_shop` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_Channel_links" DROP CONSTRAINT "_Channel_links_A_fkey";

-- DropForeignKey
ALTER TABLE "_Channel_links" DROP CONSTRAINT "_Channel_links_B_fkey";

-- DropForeignKey
ALTER TABLE "_Link_shop" DROP CONSTRAINT "_Link_shop_A_fkey";

-- DropForeignKey
ALTER TABLE "_Link_shop" DROP CONSTRAINT "_Link_shop_B_fkey";

-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "shop" TEXT;

-- DropTable
DROP TABLE "_Channel_links";

-- DropTable
DROP TABLE "_Link_shop";

-- CreateIndex
CREATE INDEX "Link_shop_idx" ON "Link"("shop");

-- CreateIndex
CREATE INDEX "Link_channel_idx" ON "Link"("channel");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_channel_fkey" FOREIGN KEY ("channel") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
