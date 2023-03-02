/*
  Warnings:

  - You are about to drop the `_ChannelItem_matches_Match_output` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_Match_input_ShopItem_matches` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `name` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `productId` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `variantId` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lineItemId` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `url` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `error` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `purchaseId` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sku` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domain` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `accessToken` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `searchEndpoint` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `placementEndpoint` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `webhookCheckEndpoint` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `webhookToggleEndpoint` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orderShipWebhookEndpoint` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orderCancelWebhookEndpoint` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stockandtrace_warehouse` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stockandtrace_account` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stockandtrace_shipto` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `productId` on table `ChannelItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `variantId` on table `ChannelItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lineItemId` on table `ChannelItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `ChannelItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `LineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `LineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `price` on table `LineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `productId` on table `LineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `variantId` on table `LineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lineItemId` on table `LineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sku` on table `LineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orderName` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `first_name` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `last_name` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `streetAddress1` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `streetAddress2` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `zip` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `currency` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalPrice` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subTotalPrice` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalDiscount` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalTax` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `country` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orderError` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `status` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `note` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phoneNumber` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canSeeOtherUsers` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canManageUsers` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canManageRoles` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canSeeOtherOrders` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canManageOrders` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canSeeOtherShops` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canManageShops` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canSeeOtherChannels` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canManageChannels` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canSeeOtherMatches` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `canManageMatches` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `type` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `domain` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `accessToken` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `searchProductsEndpoint` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `searchOrdersEndpoint` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updateProductEndpoint` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `webhookCheckEndpoint` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `webhookToggleEndpoint` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orderPlacementCallback` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orderCreateWebhookEndpoint` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `orderCancelWebhookEndpoint` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `productId` on table `ShopItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `variantId` on table `ShopItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lineItemId` on table `ShopItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `apiKey` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "_ChannelItem_matches_Match_output" DROP CONSTRAINT "_ChannelItem_matches_Match_output_A_fkey";

-- DropForeignKey
ALTER TABLE "_ChannelItem_matches_Match_output" DROP CONSTRAINT "_ChannelItem_matches_Match_output_B_fkey";

-- DropForeignKey
ALTER TABLE "_Match_input_ShopItem_matches" DROP CONSTRAINT "_Match_input_ShopItem_matches_A_fkey";

-- DropForeignKey
ALTER TABLE "_Match_input_ShopItem_matches" DROP CONSTRAINT "_Match_input_ShopItem_matches_B_fkey";

-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT E'',
ALTER COLUMN "image" SET NOT NULL,
ALTER COLUMN "image" SET DEFAULT E'',
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT E'',
ALTER COLUMN "productId" SET NOT NULL,
ALTER COLUMN "productId" SET DEFAULT E'',
ALTER COLUMN "variantId" SET NOT NULL,
ALTER COLUMN "variantId" SET DEFAULT E'',
ALTER COLUMN "lineItemId" SET NOT NULL,
ALTER COLUMN "lineItemId" SET DEFAULT E'',
ALTER COLUMN "url" SET NOT NULL,
ALTER COLUMN "url" SET DEFAULT E'',
ALTER COLUMN "error" SET NOT NULL,
ALTER COLUMN "error" SET DEFAULT E'',
ALTER COLUMN "purchaseId" SET NOT NULL,
ALTER COLUMN "purchaseId" SET DEFAULT E'',
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT E'',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "sku" SET NOT NULL,
ALTER COLUMN "sku" SET DEFAULT E'';

-- AlterTable
ALTER TABLE "Channel" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT E'',
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT E'',
ALTER COLUMN "domain" SET NOT NULL,
ALTER COLUMN "domain" SET DEFAULT E'',
ALTER COLUMN "accessToken" SET NOT NULL,
ALTER COLUMN "accessToken" SET DEFAULT E'',
ALTER COLUMN "searchEndpoint" SET NOT NULL,
ALTER COLUMN "searchEndpoint" SET DEFAULT E'',
ALTER COLUMN "placementEndpoint" SET NOT NULL,
ALTER COLUMN "placementEndpoint" SET DEFAULT E'',
ALTER COLUMN "webhookCheckEndpoint" SET NOT NULL,
ALTER COLUMN "webhookCheckEndpoint" SET DEFAULT E'',
ALTER COLUMN "webhookToggleEndpoint" SET NOT NULL,
ALTER COLUMN "webhookToggleEndpoint" SET DEFAULT E'',
ALTER COLUMN "orderShipWebhookEndpoint" SET NOT NULL,
ALTER COLUMN "orderShipWebhookEndpoint" SET DEFAULT E'',
ALTER COLUMN "orderCancelWebhookEndpoint" SET NOT NULL,
ALTER COLUMN "orderCancelWebhookEndpoint" SET DEFAULT E'',
ALTER COLUMN "stockandtrace_warehouse" SET NOT NULL,
ALTER COLUMN "stockandtrace_warehouse" SET DEFAULT E'',
ALTER COLUMN "stockandtrace_account" SET NOT NULL,
ALTER COLUMN "stockandtrace_account" SET DEFAULT E'',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "stockandtrace_shipto" SET NOT NULL,
ALTER COLUMN "stockandtrace_shipto" SET DEFAULT E'';

-- AlterTable
ALTER TABLE "ChannelItem" ALTER COLUMN "productId" SET NOT NULL,
ALTER COLUMN "productId" SET DEFAULT E'',
ALTER COLUMN "variantId" SET NOT NULL,
ALTER COLUMN "variantId" SET DEFAULT E'',
ALTER COLUMN "lineItemId" SET NOT NULL,
ALTER COLUMN "lineItemId" SET DEFAULT E'',
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT E'',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "LineItem" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT E'',
ALTER COLUMN "image" SET NOT NULL,
ALTER COLUMN "image" SET DEFAULT E'',
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT E'',
ALTER COLUMN "productId" SET NOT NULL,
ALTER COLUMN "productId" SET DEFAULT E'',
ALTER COLUMN "variantId" SET NOT NULL,
ALTER COLUMN "variantId" SET DEFAULT E'',
ALTER COLUMN "lineItemId" SET NOT NULL,
ALTER COLUMN "lineItemId" SET DEFAULT E'',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "sku" SET NOT NULL,
ALTER COLUMN "sku" SET DEFAULT E'';

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "orderName" SET NOT NULL,
ALTER COLUMN "orderName" SET DEFAULT E'',
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "email" SET DEFAULT E'',
ALTER COLUMN "first_name" SET NOT NULL,
ALTER COLUMN "first_name" SET DEFAULT E'',
ALTER COLUMN "last_name" SET NOT NULL,
ALTER COLUMN "last_name" SET DEFAULT E'',
ALTER COLUMN "streetAddress1" SET NOT NULL,
ALTER COLUMN "streetAddress1" SET DEFAULT E'',
ALTER COLUMN "streetAddress2" SET NOT NULL,
ALTER COLUMN "streetAddress2" SET DEFAULT E'',
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "city" SET DEFAULT E'',
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "state" SET DEFAULT E'',
ALTER COLUMN "zip" SET NOT NULL,
ALTER COLUMN "zip" SET DEFAULT E'',
ALTER COLUMN "currency" SET NOT NULL,
ALTER COLUMN "currency" SET DEFAULT E'',
ALTER COLUMN "totalPrice" SET NOT NULL,
ALTER COLUMN "totalPrice" SET DEFAULT E'',
ALTER COLUMN "subTotalPrice" SET NOT NULL,
ALTER COLUMN "subTotalPrice" SET DEFAULT E'',
ALTER COLUMN "totalDiscount" SET NOT NULL,
ALTER COLUMN "totalDiscount" SET DEFAULT E'',
ALTER COLUMN "totalTax" SET NOT NULL,
ALTER COLUMN "totalTax" SET DEFAULT E'',
ALTER COLUMN "country" SET NOT NULL,
ALTER COLUMN "country" SET DEFAULT E'',
ALTER COLUMN "orderError" SET NOT NULL,
ALTER COLUMN "orderError" SET DEFAULT E'',
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT E'',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "note" SET NOT NULL,
ALTER COLUMN "note" SET DEFAULT E'',
ALTER COLUMN "phoneNumber" SET NOT NULL,
ALTER COLUMN "phoneNumber" SET DEFAULT E'';

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT E'',
ALTER COLUMN "canSeeOtherUsers" SET NOT NULL,
ALTER COLUMN "canSeeOtherUsers" SET DEFAULT false,
ALTER COLUMN "canManageUsers" SET NOT NULL,
ALTER COLUMN "canManageUsers" SET DEFAULT false,
ALTER COLUMN "canManageRoles" SET NOT NULL,
ALTER COLUMN "canManageRoles" SET DEFAULT false,
ALTER COLUMN "canSeeOtherOrders" SET NOT NULL,
ALTER COLUMN "canSeeOtherOrders" SET DEFAULT false,
ALTER COLUMN "canManageOrders" SET NOT NULL,
ALTER COLUMN "canManageOrders" SET DEFAULT false,
ALTER COLUMN "canSeeOtherShops" SET NOT NULL,
ALTER COLUMN "canSeeOtherShops" SET DEFAULT false,
ALTER COLUMN "canManageShops" SET NOT NULL,
ALTER COLUMN "canManageShops" SET DEFAULT false,
ALTER COLUMN "canSeeOtherChannels" SET NOT NULL,
ALTER COLUMN "canSeeOtherChannels" SET DEFAULT false,
ALTER COLUMN "canManageChannels" SET NOT NULL,
ALTER COLUMN "canManageChannels" SET DEFAULT false,
ALTER COLUMN "canSeeOtherMatches" SET NOT NULL,
ALTER COLUMN "canSeeOtherMatches" SET DEFAULT false,
ALTER COLUMN "canManageMatches" SET NOT NULL,
ALTER COLUMN "canManageMatches" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT E'',
ALTER COLUMN "type" SET NOT NULL,
ALTER COLUMN "type" SET DEFAULT E'',
ALTER COLUMN "domain" SET NOT NULL,
ALTER COLUMN "domain" SET DEFAULT E'',
ALTER COLUMN "accessToken" SET NOT NULL,
ALTER COLUMN "accessToken" SET DEFAULT E'',
ALTER COLUMN "searchProductsEndpoint" SET NOT NULL,
ALTER COLUMN "searchProductsEndpoint" SET DEFAULT E'',
ALTER COLUMN "searchOrdersEndpoint" SET NOT NULL,
ALTER COLUMN "searchOrdersEndpoint" SET DEFAULT E'',
ALTER COLUMN "updateProductEndpoint" SET NOT NULL,
ALTER COLUMN "updateProductEndpoint" SET DEFAULT E'',
ALTER COLUMN "webhookCheckEndpoint" SET NOT NULL,
ALTER COLUMN "webhookCheckEndpoint" SET DEFAULT E'',
ALTER COLUMN "webhookToggleEndpoint" SET NOT NULL,
ALTER COLUMN "webhookToggleEndpoint" SET DEFAULT E'',
ALTER COLUMN "orderPlacementCallback" SET NOT NULL,
ALTER COLUMN "orderPlacementCallback" SET DEFAULT E'',
ALTER COLUMN "orderCreateWebhookEndpoint" SET NOT NULL,
ALTER COLUMN "orderCreateWebhookEndpoint" SET DEFAULT E'',
ALTER COLUMN "orderCancelWebhookEndpoint" SET NOT NULL,
ALTER COLUMN "orderCancelWebhookEndpoint" SET DEFAULT E'',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ShopItem" ALTER COLUMN "productId" SET NOT NULL,
ALTER COLUMN "productId" SET DEFAULT E'',
ALTER COLUMN "variantId" SET NOT NULL,
ALTER COLUMN "variantId" SET DEFAULT E'',
ALTER COLUMN "lineItemId" SET NOT NULL,
ALTER COLUMN "lineItemId" SET DEFAULT E'',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "name" SET DEFAULT E'',
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "email" SET DEFAULT E'',
ALTER COLUMN "apiKey" SET NOT NULL,
ALTER COLUMN "apiKey" SET DEFAULT E'';

-- DropTable
DROP TABLE "_ChannelItem_matches_Match_output";

-- DropTable
DROP TABLE "_Match_input_ShopItem_matches";

-- CreateTable
CREATE TABLE "_ChannelItem_matches" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Match_input" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ChannelItem_matches_AB_unique" ON "_ChannelItem_matches"("A", "B");

-- CreateIndex
CREATE INDEX "_ChannelItem_matches_B_index" ON "_ChannelItem_matches"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Match_input_AB_unique" ON "_Match_input"("A", "B");

-- CreateIndex
CREATE INDEX "_Match_input_B_index" ON "_Match_input"("B");

-- AddForeignKey
ALTER TABLE "_ChannelItem_matches" ADD FOREIGN KEY ("A") REFERENCES "ChannelItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChannelItem_matches" ADD FOREIGN KEY ("B") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Match_input" ADD FOREIGN KEY ("A") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Match_input" ADD FOREIGN KEY ("B") REFERENCES "ShopItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "CartItem.channel_index" RENAME TO "CartItem_channel_idx";

-- RenameIndex
ALTER INDEX "CartItem.order_index" RENAME TO "CartItem_order_idx";

-- RenameIndex
ALTER INDEX "CartItem.user_index" RENAME TO "CartItem_user_idx";

-- RenameIndex
ALTER INDEX "Channel.user_index" RENAME TO "Channel_user_idx";

-- RenameIndex
ALTER INDEX "ChannelItem.channel_index" RENAME TO "ChannelItem_channel_idx";

-- RenameIndex
ALTER INDEX "ChannelItem.user_index" RENAME TO "ChannelItem_user_idx";

-- RenameIndex
ALTER INDEX "LineItem.order_index" RENAME TO "LineItem_order_idx";

-- RenameIndex
ALTER INDEX "LineItem.user_index" RENAME TO "LineItem_user_idx";

-- RenameIndex
ALTER INDEX "Match.user_index" RENAME TO "Match_user_idx";

-- RenameIndex
ALTER INDEX "Order.shop_index" RENAME TO "Order_shop_idx";

-- RenameIndex
ALTER INDEX "Order.user_index" RENAME TO "Order_user_idx";

-- RenameIndex
ALTER INDEX "Shop.domain_unique" RENAME TO "Shop_domain_key";

-- RenameIndex
ALTER INDEX "Shop.linkedChannel_index" RENAME TO "Shop_linkedChannel_idx";

-- RenameIndex
ALTER INDEX "Shop.user_index" RENAME TO "Shop_user_idx";

-- RenameIndex
ALTER INDEX "ShopItem.shop_index" RENAME TO "ShopItem_shop_idx";

-- RenameIndex
ALTER INDEX "ShopItem.user_index" RENAME TO "ShopItem_user_idx";

-- RenameIndex
ALTER INDEX "User.apiKey_unique" RENAME TO "User_apiKey_key";

-- RenameIndex
ALTER INDEX "User.email_unique" RENAME TO "User_email_key";

-- RenameIndex
ALTER INDEX "User.role_index" RENAME TO "User_role_idx";
