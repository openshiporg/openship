/*
  Warnings:

  - You are about to drop the column `searchEndpoint` on the `Channel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "searchEndpoint",
ADD COLUMN     "checkTrigger" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "pushTrackingTriggerEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "removeCancelledOrdersTriggerEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "searchProductsEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "toggleTrigger" TEXT NOT NULL DEFAULT E'';

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "checkTrigger" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "pushOrdersTriggerEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "removeCancelledOrdersTriggerEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "removeChargebackOrdersTriggerEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "toggleTrigger" TEXT NOT NULL DEFAULT E'';

-- CreateTable
CREATE TABLE "ChannelCustomInput" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT E'',
    "value" TEXT NOT NULL DEFAULT E'',
    "channel" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ChannelCustomInput_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChannelCustomInput_channel_idx" ON "ChannelCustomInput"("channel");

-- CreateIndex
CREATE INDEX "ChannelCustomInput_user_idx" ON "ChannelCustomInput"("user");

-- AddForeignKey
ALTER TABLE "ChannelCustomInput" ADD CONSTRAINT "ChannelCustomInput_channel_fkey" FOREIGN KEY ("channel") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelCustomInput" ADD CONSTRAINT "ChannelCustomInput_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
