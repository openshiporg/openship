/*
  Warnings:

  - You are about to drop the column `orderPlacementCallback` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "orderPlacementCallback",
ADD COLUMN     "updateOrderEndpoint" TEXT NOT NULL DEFAULT E'';
