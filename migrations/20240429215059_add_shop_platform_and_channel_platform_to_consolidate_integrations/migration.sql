-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "platform" TEXT;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "platform" TEXT;

-- CreateTable
CREATE TABLE "ChannelPlatform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "createPurchaseFunction" TEXT NOT NULL DEFAULT 'shopify',
    "searchProductsFunction" TEXT NOT NULL DEFAULT 'shopify',
    "getWebhooksFunction" TEXT NOT NULL DEFAULT 'shopify',
    "deleteWebhookFunction" TEXT NOT NULL DEFAULT 'shopify',
    "createWebhookFunction" TEXT NOT NULL DEFAULT 'shopify',
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopPlatform" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "updateProductFunction" TEXT NOT NULL DEFAULT 'shopify',
    "getWebhooksFunction" TEXT NOT NULL DEFAULT 'shopify',
    "deleteWebhookFunction" TEXT NOT NULL DEFAULT 'shopify',
    "createWebhookFunction" TEXT NOT NULL DEFAULT 'shopify',
    "searchProductsFunction" TEXT NOT NULL DEFAULT 'shopify',
    "searchOrdersFunction" TEXT NOT NULL DEFAULT 'shopify',
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChannelPlatform_user_idx" ON "ChannelPlatform"("user");

-- CreateIndex
CREATE INDEX "ShopPlatform_user_idx" ON "ShopPlatform"("user");

-- CreateIndex
CREATE INDEX "Channel_platform_idx" ON "Channel"("platform");

-- CreateIndex
CREATE INDEX "Shop_platform_idx" ON "Shop"("platform");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_platform_fkey" FOREIGN KEY ("platform") REFERENCES "ChannelPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelPlatform" ADD CONSTRAINT "ChannelPlatform_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_platform_fkey" FOREIGN KEY ("platform") REFERENCES "ShopPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopPlatform" ADD CONSTRAINT "ShopPlatform_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
