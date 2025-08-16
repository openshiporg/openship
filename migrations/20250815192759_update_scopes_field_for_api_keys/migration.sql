/*
  Warnings:

  - The `status` column on the `ApiKey` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ApiKeyStatusType" AS ENUM ('active', 'inactive', 'revoked');

-- AlterTable
ALTER TABLE "ApiKey" ALTER COLUMN "scopes" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ApiKeyStatusType" DEFAULT 'active';
