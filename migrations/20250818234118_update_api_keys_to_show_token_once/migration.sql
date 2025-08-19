/*
  Warnings:

  - You are about to drop the column `token` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `ApiKey` table. All the data in the column will be lost.
  - Added the required column `tokenSecret` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ApiKey_tokenHash_key";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "token",
DROP COLUMN "tokenHash",
ADD COLUMN     "tokenSecret" TEXT NOT NULL;
