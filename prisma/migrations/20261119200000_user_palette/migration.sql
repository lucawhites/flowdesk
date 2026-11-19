-- Palette di colori scelta da ogni persona in Impostazioni (vale su tutti i suoi dispositivi).
ALTER TABLE "User" ADD COLUMN "palette" TEXT NOT NULL DEFAULT 'graphite';
