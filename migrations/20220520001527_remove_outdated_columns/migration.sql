/*
  Warnings:

  - You are about to drop the column `cancelOrderWebhookEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `checkWebhookEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `shipOrderWebhookEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `toggleWebhookEndpoint` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `cancelOrderWebhookEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `checkWebhookEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `createOrderWebhookEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `toggleWebhookEndpoint` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "cancelOrderWebhookEndpoint",
DROP COLUMN "checkWebhookEndpoint",
DROP COLUMN "shipOrderWebhookEndpoint",
DROP COLUMN "toggleWebhookEndpoint";

-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "cancelOrderWebhookEndpoint",
DROP COLUMN "checkWebhookEndpoint",
DROP COLUMN "createOrderWebhookEndpoint",
DROP COLUMN "toggleWebhookEndpoint";
