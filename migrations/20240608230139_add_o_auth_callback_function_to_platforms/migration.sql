-- AlterTable
ALTER TABLE "ChannelPlatform" ADD COLUMN     "oAuthCallbackFunction" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "ShopPlatform" ADD COLUMN     "oAuthCallbackFunction" TEXT NOT NULL DEFAULT '';
