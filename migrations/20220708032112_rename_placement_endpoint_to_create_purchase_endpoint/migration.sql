/*
  Warnings:

  - You are about to drop the column `placementEndpoint` on the `Channel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "placementEndpoint",
ADD COLUMN     "createPurchaseEndpoint" TEXT NOT NULL DEFAULT E'';
