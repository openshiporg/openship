-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "linkOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchOrder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "processOrder" BOOLEAN NOT NULL DEFAULT false;
