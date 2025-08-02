/*
  Warnings:

  - A unique constraint covering the columns `[quantity,productId,variantId,channel,user]` on the table `ChannelItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[quantity,productId,variantId,shop,user]` on the table `ShopItem` will be added. If there are existing duplicate values, this will fail.
  - Made the column `price` on table `ChannelItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ChannelItem" ALTER COLUMN "quantity" DROP DEFAULT,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT '',
ALTER COLUMN "price" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ShopItem" ALTER COLUMN "quantity" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "ChannelItem_quantity_productId_variantId_channel_user_key" ON "ChannelItem"("quantity", "productId", "variantId", "channel", "user");

-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_quantity_productId_variantId_shop_user_key" ON "ShopItem"("quantity", "productId", "variantId", "shop", "user");
