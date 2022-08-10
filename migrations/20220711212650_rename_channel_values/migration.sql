/*
  Warnings:

  - You are about to drop the column `checkTrigger` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `pushTrackingTriggerEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `removeCancelledOrdersTriggerEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `toggleTrigger` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `checkTrigger` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `removeCancelledOrdersTriggerEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `toggleTrigger` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "checkTrigger",
DROP COLUMN "pushTrackingTriggerEndpoint",
DROP COLUMN "removeCancelledOrdersTriggerEndpoint",
DROP COLUMN "toggleTrigger",
ADD COLUMN     "cancelPurchaseTriggerEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "checkWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "createTrackingTriggerEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "toggleWebhookEndpoint" TEXT NOT NULL DEFAULT E'';

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "checkTrigger",
DROP COLUMN "removeCancelledOrdersTriggerEndpoint",
DROP COLUMN "toggleTrigger",
ADD COLUMN     "cancelPurchaseTriggerEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "checkWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "toggleWebhookEndpoint" TEXT NOT NULL DEFAULT E'';
