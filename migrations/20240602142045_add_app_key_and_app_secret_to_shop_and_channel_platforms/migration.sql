-- AlterTable
ALTER TABLE "ChannelPlatform" ADD COLUMN     "appKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "appSecret" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "ShopPlatform" ADD COLUMN     "appKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "appSecret" TEXT NOT NULL DEFAULT '';
