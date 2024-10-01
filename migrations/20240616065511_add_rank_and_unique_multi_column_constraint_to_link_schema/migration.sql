/*
  Warnings:

  - A unique constraint covering the columns `[shop,rank]` on the table `Link` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Link" ADD COLUMN     "rank" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Link_shop_rank_key" ON "Link"("shop", "rank");
