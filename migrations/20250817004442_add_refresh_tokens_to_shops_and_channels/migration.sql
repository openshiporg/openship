-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "refreshToken" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "refreshToken" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);
