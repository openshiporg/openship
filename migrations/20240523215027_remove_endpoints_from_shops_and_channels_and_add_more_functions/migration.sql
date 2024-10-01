/*
  Warnings:

  - You are about to drop the column `createPurchaseEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `createWebhookEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `deleteWebhookEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `getWebhooksEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `searchProductsEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `createWebhookEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `deleteWebhookEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `getWebhooksEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `searchOrdersEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `searchProductsEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `updateProductEndpoint` on the `Shop` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `ChannelPlatform` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key]` on the table `ShopPlatform` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "createPurchaseEndpoint",
DROP COLUMN "createWebhookEndpoint",
DROP COLUMN "deleteWebhookEndpoint",
DROP COLUMN "getWebhooksEndpoint",
DROP COLUMN "searchProductsEndpoint",
DROP COLUMN "type";

-- AlterTable
ALTER TABLE "ChannelPlatform" ADD COLUMN     "key" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "oAuthFunction" TEXT NOT NULL DEFAULT 'shopify';

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "createWebhookEndpoint",
DROP COLUMN "deleteWebhookEndpoint",
DROP COLUMN "getWebhooksEndpoint",
DROP COLUMN "searchOrdersEndpoint",
DROP COLUMN "searchProductsEndpoint",
DROP COLUMN "type",
DROP COLUMN "updateProductEndpoint";

-- AlterTable
ALTER TABLE "ShopPlatform" ADD COLUMN     "addCartToPlatformOrderFunction" TEXT NOT NULL DEFAULT 'shopify',
ADD COLUMN     "addTrackingFunction" TEXT NOT NULL DEFAULT 'shopify',
ADD COLUMN     "key" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "oAuthFunction" TEXT NOT NULL DEFAULT 'shopify';

-- CreateIndex
CREATE UNIQUE INDEX "ChannelPlatform_key_key" ON "ChannelPlatform"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ShopPlatform_key_key" ON "ShopPlatform"("key");
