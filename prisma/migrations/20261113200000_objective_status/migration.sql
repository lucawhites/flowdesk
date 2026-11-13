-- Stato e tipo degli obiettivi al posto del "focus del mese".
-- La colonna "inFocus" resta per ora: la versione dell'app ancora online la legge
-- finché non parte il nuovo deploy. Si toglie con una migrazione successiva.

-- CreateEnum
CREATE TYPE "ObjectiveStatus" AS ENUM ('ACTIVE', 'QUEUED', 'PAUSED');

-- CreateEnum
CREATE TYPE "ObjectiveKind" AS ENUM ('STANDARD', 'ROUTINE', 'DELIVERY', 'UMBRELLA');

-- AlterTable
ALTER TABLE "Objective"
ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "afterId" TEXT,
ADD COLUMN     "cadence" TEXT,
ADD COLUMN     "kind" "ObjectiveKind" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "startDate" DATE,
ADD COLUMN     "status" "ObjectiveStatus" NOT NULL DEFAULT 'QUEUED',
ADD COLUMN     "umbrellaId" TEXT;

-- Gli obiettivi in focus diventano attivi; il riordino vero lo fa lo script dati.
UPDATE "Objective" SET "status" = 'ACTIVE', "activatedAt" = NOW() WHERE "inFocus" = true;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_afterId_fkey" FOREIGN KEY ("afterId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_umbrellaId_fkey" FOREIGN KEY ("umbrellaId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;
