-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetIssuedAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetRedeemedAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;
