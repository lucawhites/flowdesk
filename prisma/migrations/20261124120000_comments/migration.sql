-- Commenti di testo su una daily oppure su un obiettivo.
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "dailyId" TEXT,
    "objectiveId" TEXT,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id"),
    -- Attaccato a una daily oppure a un obiettivo: esattamente uno dei due.
    CONSTRAINT "Comment_target_check" CHECK (("dailyId" IS NULL) <> ("objectiveId" IS NULL))
);

CREATE INDEX "Comment_dailyId_createdAt_idx" ON "Comment"("dailyId", "createdAt");

CREATE INDEX "Comment_objectiveId_createdAt_idx" ON "Comment"("objectiveId", "createdAt");

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_dailyId_fkey" FOREIGN KEY ("dailyId") REFERENCES "Daily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment" ADD CONSTRAINT "Comment_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;
