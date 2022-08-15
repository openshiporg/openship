-- CreateTable
CREATE TABLE "ShopMetafield" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT E'',
    "value" TEXT NOT NULL DEFAULT E'',
    "shop" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopMetafield_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShopMetafield_shop_idx" ON "ShopMetafield"("shop");

-- CreateIndex
CREATE INDEX "ShopMetafield_user_idx" ON "ShopMetafield"("user");

-- AddForeignKey
ALTER TABLE "ShopMetafield" ADD CONSTRAINT "ShopMetafield_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopMetafield" ADD CONSTRAINT "ShopMetafield_shop_fkey" FOREIGN KEY ("shop") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
