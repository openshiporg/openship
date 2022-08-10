/*
  Warnings:

  - A unique constraint covering the columns `[apiKey]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "apiKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User.apiKey_unique" ON "User"("apiKey");
