-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "canSeeOtherUsers" BOOLEAN NOT NULL DEFAULT false,
    "canEditOtherUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageRoles" BOOLEAN NOT NULL DEFAULT false,
    "canAccessDashboard" BOOLEAN NOT NULL DEFAULT false,
    "canSeeOtherShops" BOOLEAN NOT NULL DEFAULT false,
    "canManageShops" BOOLEAN NOT NULL DEFAULT false,
    "canCreateShops" BOOLEAN NOT NULL DEFAULT false,
    "canSeeOtherChannels" BOOLEAN NOT NULL DEFAULT false,
    "canManageChannels" BOOLEAN NOT NULL DEFAULT false,
    "canCreateChannels" BOOLEAN NOT NULL DEFAULT false,
    "canSeeOtherOrders" BOOLEAN NOT NULL DEFAULT false,
    "canManageOrders" BOOLEAN NOT NULL DEFAULT false,
    "canProcessOrders" BOOLEAN NOT NULL DEFAULT false,
    "canSeeOtherMatches" BOOLEAN NOT NULL DEFAULT false,
    "canManageMatches" BOOLEAN NOT NULL DEFAULT false,
    "canCreateMatches" BOOLEAN NOT NULL DEFAULT false,
    "canSeeOtherLinks" BOOLEAN NOT NULL DEFAULT false,
    "canManageLinks" BOOLEAN NOT NULL DEFAULT false,
    "canCreateLinks" BOOLEAN NOT NULL DEFAULT false,
    "canManagePlatforms" BOOLEAN NOT NULL DEFAULT false,
    "canViewPlatformMetrics" BOOLEAN NOT NULL DEFAULT false,
    "canManageApiKeys" BOOLEAN NOT NULL DEFAULT false,
    "canCreateApiKeys" BOOLEAN NOT NULL DEFAULT false,
    "canAccessAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "canExportData" BOOLEAN NOT NULL DEFAULT false,
    "canManageWebhooks" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopPlatform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "appKey" TEXT NOT NULL DEFAULT '',
    "appSecret" TEXT NOT NULL DEFAULT '',
    "orderLinkFunction" TEXT NOT NULL DEFAULT '',
    "updateProductFunction" TEXT NOT NULL DEFAULT '',
    "getWebhooksFunction" TEXT NOT NULL DEFAULT '',
    "deleteWebhookFunction" TEXT NOT NULL DEFAULT '',
    "createWebhookFunction" TEXT NOT NULL DEFAULT '',
    "searchProductsFunction" TEXT NOT NULL DEFAULT '',
    "getProductFunction" TEXT NOT NULL DEFAULT '',
    "searchOrdersFunction" TEXT NOT NULL DEFAULT '',
    "addTrackingFunction" TEXT NOT NULL DEFAULT '',
    "addCartToPlatformOrderFunction" TEXT NOT NULL DEFAULT '',
    "cancelOrderWebhookHandler" TEXT NOT NULL DEFAULT '',
    "createOrderWebhookHandler" TEXT NOT NULL DEFAULT '',
    "oAuthFunction" TEXT NOT NULL DEFAULT '',
    "oAuthCallbackFunction" TEXT NOT NULL DEFAULT '',
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelPlatform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "appKey" TEXT NOT NULL DEFAULT '',
    "appSecret" TEXT NOT NULL DEFAULT '',
    "createPurchaseFunction" TEXT NOT NULL DEFAULT '',
    "searchProductsFunction" TEXT NOT NULL DEFAULT '',
    "getProductFunction" TEXT NOT NULL DEFAULT '',
    "getWebhooksFunction" TEXT NOT NULL DEFAULT '',
    "deleteWebhookFunction" TEXT NOT NULL DEFAULT '',
    "createWebhookFunction" TEXT NOT NULL DEFAULT '',
    "cancelPurchaseWebhookHandler" TEXT NOT NULL DEFAULT '',
    "createTrackingWebhookHandler" TEXT NOT NULL DEFAULT '',
    "oAuthFunction" TEXT NOT NULL DEFAULT '',
    "oAuthCallbackFunction" TEXT NOT NULL DEFAULT '',
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "domain" TEXT NOT NULL DEFAULT '',
    "accessToken" TEXT NOT NULL DEFAULT '',
    "linkMode" TEXT DEFAULT 'sequential',
    "metadata" JSONB DEFAULT '{}',
    "platform" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "domain" TEXT NOT NULL DEFAULT '',
    "accessToken" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB DEFAULT '{}',
    "platform" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL DEFAULT '',
    "orderName" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "first_name" TEXT NOT NULL DEFAULT '',
    "last_name" TEXT NOT NULL DEFAULT '',
    "streetAddress1" TEXT NOT NULL DEFAULT '',
    "streetAddress2" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "zip" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT '',
    "totalPrice" DOUBLE PRECISION,
    "subTotalPrice" DOUBLE PRECISION,
    "totalDiscounts" DOUBLE PRECISION,
    "totalTax" DOUBLE PRECISION,
    "linkOrder" BOOLEAN NOT NULL DEFAULT true,
    "matchOrder" BOOLEAN NOT NULL DEFAULT true,
    "processOrder" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT NOT NULL DEFAULT '',
    "orderMetadata" JSONB,
    "shop" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION,
    "quantity" INTEGER,
    "productId" TEXT NOT NULL DEFAULT '',
    "variantId" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "lineItemId" TEXT NOT NULL DEFAULT '',
    "order" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "price" DOUBLE PRECISION,
    "quantity" INTEGER,
    "productId" TEXT NOT NULL DEFAULT '',
    "variantId" TEXT NOT NULL DEFAULT '',
    "sku" TEXT NOT NULL DEFAULT '',
    "lineItemId" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "error" TEXT NOT NULL DEFAULT '',
    "purchaseId" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "order" TEXT,
    "channel" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL DEFAULT '',
    "variantId" TEXT NOT NULL DEFAULT '',
    "lineItemId" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER DEFAULT 1,
    "shop" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL DEFAULT '',
    "variantId" TEXT NOT NULL DEFAULT '',
    "lineItemId" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER DEFAULT 1,
    "price" DOUBLE PRECISION,
    "channel" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL,
    "rank" INTEGER DEFAULT 1,
    "filters" JSONB DEFAULT '[]',
    "customWhere" JSONB DEFAULT '{}',
    "shop" TEXT,
    "channel" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackingDetail" (
    "id" TEXT NOT NULL,
    "trackingCompany" TEXT NOT NULL DEFAULT '',
    "trackingNumber" TEXT NOT NULL DEFAULT '',
    "purchaseId" TEXT NOT NULL DEFAULT '',
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CartItem_trackingDetails" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

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
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "ApiKey_user_idx" ON "ApiKey"("user");

-- CreateIndex
CREATE INDEX "ShopPlatform_user_idx" ON "ShopPlatform"("user");

-- CreateIndex
CREATE INDEX "ChannelPlatform_user_idx" ON "ChannelPlatform"("user");

-- CreateIndex
CREATE INDEX "Shop_platform_idx" ON "Shop"("platform");

-- CreateIndex
CREATE INDEX "Shop_user_idx" ON "Shop"("user");

-- CreateIndex
CREATE INDEX "Channel_platform_idx" ON "Channel"("platform");

-- CreateIndex
CREATE INDEX "Channel_user_idx" ON "Channel"("user");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "Order"("orderId");

-- CreateIndex
CREATE INDEX "Order_shop_idx" ON "Order"("shop");

-- CreateIndex
CREATE INDEX "Order_user_idx" ON "Order"("user");

-- CreateIndex
CREATE INDEX "LineItem_order_idx" ON "LineItem"("order");

-- CreateIndex
CREATE INDEX "LineItem_user_idx" ON "LineItem"("user");

-- CreateIndex
CREATE INDEX "CartItem_order_idx" ON "CartItem"("order");

-- CreateIndex
CREATE INDEX "CartItem_channel_idx" ON "CartItem"("channel");

-- CreateIndex
CREATE INDEX "CartItem_user_idx" ON "CartItem"("user");

-- CreateIndex
CREATE INDEX "ShopItem_shop_idx" ON "ShopItem"("shop");

-- CreateIndex
CREATE INDEX "ShopItem_user_idx" ON "ShopItem"("user");

-- CreateIndex
CREATE INDEX "ChannelItem_channel_idx" ON "ChannelItem"("channel");

-- CreateIndex
CREATE INDEX "ChannelItem_user_idx" ON "ChannelItem"("user");

-- CreateIndex
CREATE INDEX "Match_user_idx" ON "Match"("user");

-- CreateIndex
CREATE INDEX "Link_shop_idx" ON "Link"("shop");

-- CreateIndex
CREATE INDEX "Link_channel_idx" ON "Link"("channel");

-- CreateIndex
CREATE INDEX "Link_user_idx" ON "Link"("user");

-- CreateIndex
CREATE INDEX "TrackingDetail_user_idx" ON "TrackingDetail"("user");

-- CreateIndex
CREATE UNIQUE INDEX "_CartItem_trackingDetails_AB_unique" ON "_CartItem_trackingDetails"("A", "B");

-- CreateIndex
CREATE INDEX "_CartItem_trackingDetails_B_index" ON "_CartItem_trackingDetails"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ChannelItem_matches_AB_unique" ON "_ChannelItem_matches"("A", "B");

-- CreateIndex
CREATE INDEX "_ChannelItem_matches_B_index" ON "_ChannelItem_matches"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_Match_input_AB_unique" ON "_Match_input"("A", "B");

-- CreateIndex
CREATE INDEX "_Match_input_B_index" ON "_Match_input"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_fkey" FOREIGN KEY ("role") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopPlatform" ADD CONSTRAINT "ShopPlatform_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelPlatform" ADD CONSTRAINT "ChannelPlatform_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_platform_fkey" FOREIGN KEY ("platform") REFERENCES "ShopPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_platform_fkey" FOREIGN KEY ("platform") REFERENCES "ChannelPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_channel_fkey" FOREIGN KEY ("channel") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopItem" ADD CONSTRAINT "ShopItem_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopItem" ADD CONSTRAINT "ShopItem_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelItem" ADD CONSTRAINT "ChannelItem_channel_fkey" FOREIGN KEY ("channel") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelItem" ADD CONSTRAINT "ChannelItem_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_channel_fkey" FOREIGN KEY ("channel") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingDetail" ADD CONSTRAINT "TrackingDetail_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartItem_trackingDetails" ADD CONSTRAINT "_CartItem_trackingDetails_A_fkey" FOREIGN KEY ("A") REFERENCES "CartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CartItem_trackingDetails" ADD CONSTRAINT "_CartItem_trackingDetails_B_fkey" FOREIGN KEY ("B") REFERENCES "TrackingDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChannelItem_matches" ADD CONSTRAINT "_ChannelItem_matches_A_fkey" FOREIGN KEY ("A") REFERENCES "ChannelItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChannelItem_matches" ADD CONSTRAINT "_ChannelItem_matches_B_fkey" FOREIGN KEY ("B") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Match_input" ADD CONSTRAINT "_Match_input_A_fkey" FOREIGN KEY ("A") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Match_input" ADD CONSTRAINT "_Match_input_B_fkey" FOREIGN KEY ("B") REFERENCES "ShopItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
