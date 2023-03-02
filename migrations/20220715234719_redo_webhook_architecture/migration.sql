/*
  Warnings:

  - You are about to drop the column `cancelPurchaseTriggerEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `checkWebhookEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `createTrackingTriggerEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `toggleWebhookEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `cancelOrderTriggerEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `checkWebhookEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `createOrderTriggerEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `toggleWebhookEndpoint` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "cancelPurchaseTriggerEndpoint",
DROP COLUMN "checkWebhookEndpoint",
DROP COLUMN "createTrackingTriggerEndpoint",
DROP COLUMN "toggleWebhookEndpoint",
ADD COLUMN     "createWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "deleteWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "getWebhooksEndpoint" TEXT NOT NULL DEFAULT E'';

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "cancelOrderTriggerEndpoint",
DROP COLUMN "checkWebhookEndpoint",
DROP COLUMN "createOrderTriggerEndpoint",
DROP COLUMN "toggleWebhookEndpoint",
ADD COLUMN     "createWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "deleteWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "getWebhooksEndpoint" TEXT NOT NULL DEFAULT E'';
