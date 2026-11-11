-- AlterTable
ALTER TABLE "Daily" ADD COLUMN     "agentRunId" TEXT,
ADD COLUMN     "stepId" TEXT;

-- AlterTable
ALTER TABLE "Objective" ADD COLUMN     "inFocus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metricApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metricCurrent" DOUBLE PRECISION,
ADD COLUMN     "metricLabel" TEXT,
ADD COLUMN     "metricTarget" DOUBLE PRECISION,
ADD COLUMN     "metricUnit" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "areas" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "ObjectiveStep" (
    "id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "objectiveId" TEXT NOT NULL,

    CONSTRAINT "ObjectiveStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "model" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "summary" TEXT,
    "error" TEXT,
    "output" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "teamId" TEXT NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ObjectiveStep_objectiveId_idx" ON "ObjectiveStep"("objectiveId");

-- CreateIndex
CREATE INDEX "AgentRun_teamId_day_idx" ON "AgentRun"("teamId", "day");

-- AddForeignKey
ALTER TABLE "ObjectiveStep" ADD CONSTRAINT "ObjectiveStep_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRun" ADD CONSTRAINT "AgentRun_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Daily" ADD CONSTRAINT "Daily_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ObjectiveStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Daily" ADD CONSTRAINT "Daily_agentRunId_fkey" FOREIGN KEY ("agentRunId") REFERENCES "AgentRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
