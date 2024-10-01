-- AlterTable
ALTER TABLE "ChannelPlatform" ADD COLUMN     "getProductFunction" TEXT NOT NULL DEFAULT 'shopify';

-- AlterTable
ALTER TABLE "ShopPlatform" ADD COLUMN     "getProductFunction" TEXT NOT NULL DEFAULT 'shopify';
