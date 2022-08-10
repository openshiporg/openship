/*
  Warnings:

  - A unique constraint covering the columns `[domain]` on the table `Shop` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetIssuedAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetRedeemedAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateTable
CREATE TABLE "APIKey" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "APIKey.user_index" ON "APIKey"("user");

-- CreateIndex
CREATE UNIQUE INDEX "Shop.domain_unique" ON "Shop"("domain");

-- AddForeignKey
ALTER TABLE "APIKey" ADD FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
