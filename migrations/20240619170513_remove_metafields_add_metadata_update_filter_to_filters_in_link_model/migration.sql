/*
  Warnings:

  - You are about to drop the column `filter` on the `Link` table. All the data in the column will be lost.
  - You are about to drop the `ChannelMetafield` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ShopMetafield` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChannelMetafield" DROP CONSTRAINT "ChannelMetafield_channel_fkey";

-- DropForeignKey
ALTER TABLE "ChannelMetafield" DROP CONSTRAINT "ChannelMetafield_user_fkey";

-- DropForeignKey
ALTER TABLE "ShopMetafield" DROP CONSTRAINT "ShopMetafield_shop_fkey";

-- DropForeignKey
ALTER TABLE "ShopMetafield" DROP CONSTRAINT "ShopMetafield_user_fkey";

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Link" DROP COLUMN "filter",
ADD COLUMN     "filters" JSONB;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "metadata" JSONB;

-- DropTable
DROP TABLE "ChannelMetafield";

-- DropTable
DROP TABLE "ShopMetafield";
