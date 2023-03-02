/*
  Warnings:

  - The `shippingMethod` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "LineItem" ADD COLUMN     "sku" TEXT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "shippingMethod",
ADD COLUMN     "shippingMethod" JSONB;
