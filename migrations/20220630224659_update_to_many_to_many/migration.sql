/*
  Warnings:

  - You are about to drop the column `cartItem` on the `TrackingDetail` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrackingDetail" DROP CONSTRAINT "TrackingDetail_cartItem_fkey";

-- DropIndex
DROP INDEX "TrackingDetail_cartItem_idx";

-- AlterTable
ALTER TABLE "TrackingDetail" DROP COLUMN "cartItem";

-- CreateTable
CREATE TABLE "_CartItem_trackingDetails" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CartItem_trackingDetails_AB_unique" ON "_CartItem_trackingDetails"("A", "B");

-- CreateIndex
CREATE INDEX "_CartItem_trackingDetails_B_index" ON "_CartItem_trackingDetails"("B");

-- AddForeignKey
ALTER TABLE "_CartItem_trackingDetails" ADD FOREIGN KEY ("A") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartItem_trackingDetails" ADD FOREIGN KEY ("B") REFERENCES "TrackingDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;
