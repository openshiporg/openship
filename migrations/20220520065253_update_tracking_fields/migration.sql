/*
  Warnings:

  - Made the column `createdAt` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `CartItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Channel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `ChannelCustomInput` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `ChannelCustomInput` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `ChannelItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `ChannelItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `LineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `LineItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Match` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdAt` on table `ShopItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `ShopItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Channel" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "ChannelCustomInput" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "ChannelItem" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "LineItem" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "ShopItem" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;
