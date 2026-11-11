-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_creatorId_fkey";

-- DropTable
DROP TABLE "Task";

-- DropEnum
DROP TYPE "Period";

-- DropEnum
DROP TYPE "Status";

-- DropEnum
DROP TYPE "Priority";

