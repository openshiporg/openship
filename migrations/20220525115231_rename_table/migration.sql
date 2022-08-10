/*
  Warnings:

  - You are about to drop the `APIKey` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "APIKey" DROP CONSTRAINT "APIKey_user_fkey";

-- DropTable
DROP TABLE "APIKey";

-- CreateTable
CREATE TABLE "apiKey" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "apiKey_user_idx" ON "apiKey"("user");

-- AddForeignKey
ALTER TABLE "apiKey" ADD CONSTRAINT "apiKey_user_fkey" FOREIGN KEY ("user") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
