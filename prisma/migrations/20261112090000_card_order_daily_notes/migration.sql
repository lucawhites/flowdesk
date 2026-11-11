-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "position" INTEGER;

-- AlterTable
ALTER TABLE "Objective" ADD COLUMN     "position" INTEGER;

-- AlterTable
ALTER TABLE "Daily" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "position" INTEGER;
