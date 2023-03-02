/*
  Warnings:

  - You are about to drop the `ChannelCustomInput` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChannelCustomInput" DROP CONSTRAINT "ChannelCustomInput_channel_fkey";

-- DropForeignKey
ALTER TABLE "ChannelCustomInput" DROP CONSTRAINT "ChannelCustomInput_user_fkey";

-- DropTable
DROP TABLE "ChannelCustomInput";

-- CreateTable
CREATE TABLE "ChannelMetafield" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT E'',
    "value" TEXT NOT NULL DEFAULT E'',
    "channel" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelMetafield_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChannelMetafield_channel_idx" ON "ChannelMetafield"("channel");

-- CreateIndex
CREATE INDEX "ChannelMetafield_user_idx" ON "ChannelMetafield"("user");

-- AddForeignKey
ALTER TABLE "ChannelMetafield" ADD CONSTRAINT "ChannelMetafield_channel_fkey" FOREIGN KEY ("channel") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMetafield" ADD CONSTRAINT "ChannelMetafield_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
