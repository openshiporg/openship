-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "role" TEXT,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "canSeeOtherUsers" BOOLEAN,
    "canManageUsers" BOOLEAN,
    "canManageRoles" BOOLEAN,
    "canSeeOtherOrders" BOOLEAN,
    "canManageOrders" BOOLEAN,
    "canSeeOtherShops" BOOLEAN,
    "canManageShops" BOOLEAN,
    "canSeeOtherChannels" BOOLEAN,
    "canManageChannels" BOOLEAN,
    "canSeeOtherMatches" BOOLEAN,
    "canManageMatches" BOOLEAN,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderId" DOUBLE PRECISION,
    "orderName" TEXT,
    "email" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "streetAddress1" TEXT,
    "streetAddress2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "currency" TEXT,
    "totalPrice" TEXT,
    "subTotalPrice" TEXT,
    "totalDiscount" TEXT,
    "totalTax" TEXT,
    "shippingMethod" TEXT,
    "country" TEXT,
    "orderError" TEXT,
    "status" TEXT,
    "locationId" DOUBLE PRECISION,
    "user" TEXT,
    "shop" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineItem" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "price" TEXT,
    "quantity" INTEGER,
    "productId" TEXT,
    "variantId" TEXT,
    "lineItemId" TEXT,
    "order" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "price" TEXT,
    "quantity" INTEGER,
    "productId" TEXT,
    "variantId" TEXT,
    "lineItemId" TEXT,
    "url" TEXT,
    "error" TEXT,
    "purchaseId" TEXT,
    "status" TEXT,
    "order" TEXT,
    "user" TEXT,
    "channel" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "domain" TEXT,
    "accessToken" TEXT,
    "searchProductsEndpoint" TEXT,
    "searchOrdersEndpoint" TEXT,
    "updateProductEndpoint" TEXT,
    "webhookCheckEndpoint" TEXT,
    "webhookToggleEndpoint" TEXT,
    "orderPlacementCallback" TEXT,
    "orderCreateWebhookEndpoint" TEXT,
    "orderCancelWebhookEndpoint" TEXT,
    "linkedChannel" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "type" TEXT,
    "domain" TEXT,
    "accessToken" TEXT,
    "searchEndpoint" TEXT,
    "placementEndpoint" TEXT,
    "webhookCheckEndpoint" TEXT,
    "webhookToggleEndpoint" TEXT,
    "orderShipWebhookEndpoint" TEXT,
    "orderCancelWebhookEndpoint" TEXT,
    "stockandtrace_warehouse" TEXT,
    "stockandtrace_account" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER,
    "productId" TEXT,
    "variantId" TEXT,
    "lineItemId" TEXT,
    "price" TEXT,
    "channel" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER,
    "productId" TEXT,
    "variantId" TEXT,
    "lineItemId" TEXT,
    "shop" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ChannelItem_matches_Match_output" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_Match_input_ShopItem_matches" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- CreateIndex
CREATE INDEX "User.role_index" ON "User"("role");

-- CreateIndex
CREATE INDEX "Order.user_index" ON "Order"("user");

-- CreateIndex
CREATE INDEX "Order.shop_index" ON "Order"("shop");

-- CreateIndex
CREATE INDEX "LineItem.order_index" ON "LineItem"("order");

-- CreateIndex
CREATE INDEX "LineItem.user_index" ON "LineItem"("user");

-- CreateIndex
CREATE INDEX "CartItem.order_index" ON "CartItem"("order");

-- CreateIndex
CREATE INDEX "CartItem.user_index" ON "CartItem"("user");

-- CreateIndex
CREATE INDEX "CartItem.channel_index" ON "CartItem"("channel");

-- CreateIndex
CREATE INDEX "Shop.linkedChannel_index" ON "Shop"("linkedChannel");

-- CreateIndex
CREATE INDEX "Shop.user_index" ON "Shop"("user");

-- CreateIndex
CREATE INDEX "Channel.user_index" ON "Channel"("user");

-- CreateIndex
CREATE INDEX "ChannelItem.channel_index" ON "ChannelItem"("channel");

-- CreateIndex
CREATE INDEX "ChannelItem.user_index" ON "ChannelItem"("user");

-- CreateIndex
CREATE INDEX "ShopItem.shop_index" ON "ShopItem"("shop");

-- CreateIndex
CREATE INDEX "ShopItem.user_index" ON "ShopItem"("user");

-- CreateIndex
CREATE INDEX "Match.user_index" ON "Match"("user");

-- CreateIndex
CREATE UNIQUE INDEX "_ChannelItem_matches_Match_output_AB_unique" ON "_ChannelItem_matches_Match_output"("A", "B");

-- CreateIndex
CREATE INDEX "_ChannelItem_matches_Match_output_B_index" ON "_ChannelItem_matches_Match_output"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Match_input_ShopItem_matches_AB_unique" ON "_Match_input_ShopItem_matches"("A", "B");

-- CreateIndex
CREATE INDEX "_Match_input_ShopItem_matches_B_index" ON "_Match_input_ShopItem_matches"("B");

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("role") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD FOREIGN KEY ("channel") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD FOREIGN KEY ("linkedChannel") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelItem" ADD FOREIGN KEY ("channel") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelItem" ADD FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopItem" ADD FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopItem" ADD FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChannelItem_matches_Match_output" ADD FOREIGN KEY ("A") REFERENCES "ChannelItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChannelItem_matches_Match_output" ADD FOREIGN KEY ("B") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Match_input_ShopItem_matches" ADD FOREIGN KEY ("A") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Match_input_ShopItem_matches" ADD FOREIGN KEY ("B") REFERENCES "ShopItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
