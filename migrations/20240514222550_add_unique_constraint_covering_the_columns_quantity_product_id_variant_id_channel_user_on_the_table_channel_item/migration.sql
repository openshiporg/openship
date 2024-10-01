/*
  Warnings:

  - A unique constraint covering the columns `[quantity,productId,variantId,channel,user]` on the table `ChannelItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ChannelItem_quantity_productId_variantId_channel_user_key" ON "ChannelItem"("quantity", "productId", "variantId", "channel", "user");
