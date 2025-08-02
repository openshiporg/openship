/*
  Warnings:

  - Made the column `price` on table `CartItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT '',
ALTER COLUMN "price" SET DATA TYPE TEXT;
