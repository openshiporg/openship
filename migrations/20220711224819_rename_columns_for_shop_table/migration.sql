/*
  Warnings:

  - You are about to drop the column `cancelPurchaseTriggerEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `pushOrdersTriggerEndpoint` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `removeChargebackOrdersTriggerEndpoint` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "cancelPurchaseTriggerEndpoint",
DROP COLUMN "pushOrdersTriggerEndpoint",
DROP COLUMN "removeChargebackOrdersTriggerEndpoint",
ADD COLUMN     "cancelOrderTriggerEndpoint" TEXT NOT NULL DEFAULT E'',
ADD COLUMN     "createOrderTriggerEndpoint" TEXT NOT NULL DEFAULT E'';
