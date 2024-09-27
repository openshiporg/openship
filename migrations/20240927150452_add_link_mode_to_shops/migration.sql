-- CreateEnum
CREATE TYPE "ShopLinkModeType" AS ENUM ('sequential', 'simultaneous');

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "linkMode" "ShopLinkModeType" DEFAULT 'sequential';
