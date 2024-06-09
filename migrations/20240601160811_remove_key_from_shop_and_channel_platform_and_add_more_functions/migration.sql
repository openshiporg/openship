/*
  Warnings:

  - You are about to drop the column `key` on the `ChannelPlatform` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `ShopPlatform` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "ChannelPlatform_key_key";

-- DropIndex
DROP INDEX "ShopPlatform_key_key";

-- AlterTable
ALTER TABLE "ChannelPlatform" DROP COLUMN "key",
ADD COLUMN     "cancelPurchaseWebhookHandler" TEXT NOT NULL DEFAULT 'shopify',
ADD COLUMN     "createTrackingWebhookHandler" TEXT NOT NULL DEFAULT 'shopify';

-- AlterTable
ALTER TABLE "ShopPlatform" DROP COLUMN "key",
ADD COLUMN     "cancelOrderWebhookHandler" TEXT NOT NULL DEFAULT 'shopify',
ADD COLUMN     "createOrderWebhookHandler" TEXT NOT NULL DEFAULT 'shopify';
