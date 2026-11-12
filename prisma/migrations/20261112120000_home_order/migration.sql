-- AlterTable
ALTER TABLE "User" ADD COLUMN     "homeOrder" TEXT[] DEFAULT ARRAY[]::TEXT[];
