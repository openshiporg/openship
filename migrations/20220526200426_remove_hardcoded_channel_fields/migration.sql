/*
  Warnings:

  - You are about to drop the column `stockandtrace_account` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `stockandtrace_shipto` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `stockandtrace_warehouse` on the `Channel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "stockandtrace_account",
DROP COLUMN "stockandtrace_shipto",
DROP COLUMN "stockandtrace_warehouse";
