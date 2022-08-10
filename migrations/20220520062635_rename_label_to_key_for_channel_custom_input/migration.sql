/*
  Warnings:

  - You are about to drop the column `label` on the `ChannelCustomInput` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ChannelCustomInput" DROP COLUMN "label",
ADD COLUMN     "key" TEXT NOT NULL DEFAULT E'';
