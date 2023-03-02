-- CreateTable
CREATE TABLE "TrackingDetail" (
    "id" TEXT NOT NULL,
    "trackingCompany" TEXT NOT NULL DEFAULT E'',
    "trackingNumber" TEXT NOT NULL DEFAULT E'',
    "order" TEXT,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackingDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackingDetail_order_idx" ON "TrackingDetail"("order");

-- CreateIndex
CREATE INDEX "TrackingDetail_user_idx" ON "TrackingDetail"("user");

-- AddForeignKey
ALTER TABLE "TrackingDetail" ADD CONSTRAINT "TrackingDetail_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackingDetail" ADD CONSTRAINT "TrackingDetail_order_fkey" FOREIGN KEY ("order") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
