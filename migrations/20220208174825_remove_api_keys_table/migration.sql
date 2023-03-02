/*
  Warnings:

  - You are about to drop the `APIKey` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "APIKey" DROP CONSTRAINT "APIKey_user_fkey";

-- DropTable
DROP TABLE "APIKey";
