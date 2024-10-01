/*
  Warnings:

  - A unique constraint covering the columns `[quantity,productId,variantId,shop,user]` on the table `ShopItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_quantity_productId_variantId_shop_user_key" ON "ShopItem"("quantity", "productId", "variantId", "shop", "user");
