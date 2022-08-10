/*
  Warnings:

  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CartItem" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Channel" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ChannelItem" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "LineItem" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Match" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Shop" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ShopItem" ALTER COLUMN "createdAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;
