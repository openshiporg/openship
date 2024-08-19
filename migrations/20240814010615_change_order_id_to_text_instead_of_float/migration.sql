/*
  Warnings:

  - Made the column `orderId` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "orderId" SET NOT NULL,
ALTER COLUMN "orderId" SET DEFAULT '',
ALTER COLUMN "orderId" SET DATA TYPE TEXT;
