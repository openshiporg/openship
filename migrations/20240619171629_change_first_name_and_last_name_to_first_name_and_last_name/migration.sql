/*
  Warnings:

  - You are about to drop the column `first_name` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "first_name",
DROP COLUMN "last_name",
ADD COLUMN     "firstName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lastName" TEXT NOT NULL DEFAULT '';
