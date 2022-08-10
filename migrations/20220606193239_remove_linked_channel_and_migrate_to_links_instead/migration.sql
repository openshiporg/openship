/*
  Warnings:

  - You are about to drop the column `linkedChannel` on the `Shop` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_linkedChannel_fkey";

-- DropIndex
DROP INDEX "Shop_linkedChannel_idx";

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "linkedChannel";
