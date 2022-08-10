/*
  Warnings:

  - You are about to drop the column `order` on the `TrackingDetail` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "TrackingDetail" DROP CONSTRAINT "TrackingDetail_order_fkey";

-- DropIndex
DROP INDEX "TrackingDetail_order_idx";

-- AlterTable
ALTER TABLE "TrackingDetail" DROP COLUMN "order",
ADD COLUMN     "cartItem" TEXT;

-- CreateIndex
CREATE INDEX "TrackingDetail_cartItem_idx" ON "TrackingDetail"("cartItem");

-- AddForeignKey
ALTER TABLE "TrackingDetail" ADD CONSTRAINT "TrackingDetail_cartItem_fkey" FOREIGN KEY ("cartItem") REFERENCES "CartItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
