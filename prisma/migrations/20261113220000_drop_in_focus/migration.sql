-- Il "focus del mese" è stato sostituito da stato e tipo dell'obiettivo (migrazione 20261113200000).
-- L'app online non legge più questa colonna dal commit 3cd3b7f.
ALTER TABLE "Objective" DROP COLUMN "inFocus";
