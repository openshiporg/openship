-- AlterTable
ALTER TABLE "ChannelPlatform" ALTER COLUMN "createPurchaseFunction" SET DEFAULT '',
ALTER COLUMN "searchProductsFunction" SET DEFAULT '',
ALTER COLUMN "getWebhooksFunction" SET DEFAULT '',
ALTER COLUMN "deleteWebhookFunction" SET DEFAULT '',
ALTER COLUMN "createWebhookFunction" SET DEFAULT '',
ALTER COLUMN "getProductFunction" SET DEFAULT '',
ALTER COLUMN "oAuthFunction" SET DEFAULT '',
ALTER COLUMN "cancelPurchaseWebhookHandler" SET DEFAULT '',
ALTER COLUMN "createTrackingWebhookHandler" SET DEFAULT '';

-- AlterTable
ALTER TABLE "ShopPlatform" ALTER COLUMN "updateProductFunction" SET DEFAULT '',
ALTER COLUMN "getWebhooksFunction" SET DEFAULT '',
ALTER COLUMN "deleteWebhookFunction" SET DEFAULT '',
ALTER COLUMN "createWebhookFunction" SET DEFAULT '',
ALTER COLUMN "searchProductsFunction" SET DEFAULT '',
ALTER COLUMN "searchOrdersFunction" SET DEFAULT '',
ALTER COLUMN "getProductFunction" SET DEFAULT '',
ALTER COLUMN "addCartToPlatformOrderFunction" SET DEFAULT '',
ALTER COLUMN "addTrackingFunction" SET DEFAULT '',
ALTER COLUMN "oAuthFunction" SET DEFAULT '',
ALTER COLUMN "cancelOrderWebhookHandler" SET DEFAULT '',
ALTER COLUMN "createOrderWebhookHandler" SET DEFAULT '';
