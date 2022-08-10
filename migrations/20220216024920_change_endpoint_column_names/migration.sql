/*
  Warnings:

  - You are about to drop the column `orderCancelWebhookEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `orderShipWebhookEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `webhookCheckEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `webhookToggleEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `orderCancelWebhookEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `orderCreateWebhookEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `webhookCheckEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `webhookToggleEndpoint` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "orderCancelWebhookEndpoint",
DROP COLUMN "orderShipWebhookEndpoint",
DROP COLUMN "webhookCheckEndpoint",
DROP COLUMN "webhookToggleEndpoint",
ADD COLUMN     "cancelOrderWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "checkWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "shipOrderWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "toggleWebhookEndpoint" TEXT NOT NULL DEFAULT E'';

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "orderCancelWebhookEndpoint",
DROP COLUMN "orderCreateWebhookEndpoint",
DROP COLUMN "webhookCheckEndpoint",
DROP COLUMN "webhookToggleEndpoint",
ADD COLUMN     "cancelOrderWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "checkWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "createOrderWebhookEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "toggleWebhookEndpoint" TEXT NOT NULL DEFAULT E'';
