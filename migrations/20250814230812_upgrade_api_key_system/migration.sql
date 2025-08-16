/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "restrictedToIPs" JSONB DEFAULT '[]',
ADD COLUMN     "scopes" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "status" TEXT DEFAULT 'active',
ADD COLUMN     "tokenHash" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tokenPreview" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "usageCount" JSONB DEFAULT '{"total":0,"daily":{}}';

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_tokenHash_key" ON "ApiKey"("tokenHash");
