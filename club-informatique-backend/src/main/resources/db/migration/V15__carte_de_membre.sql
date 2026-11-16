-- ===================================================================
-- V15 : carte de membre
-- ===================================================================
-- Jeton opaque encodé dans le QR code de la carte : il identifie le titulaire au pointage sans exposer
-- aucune donnée personnelle. Attribué à la première demande de carte.

ALTER TABLE utilisateur ADD COLUMN carte_jeton VARCHAR(32);
CREATE UNIQUE INDEX ux_utilisateur_carte_jeton ON utilisateur(carte_jeton) WHERE carte_jeton IS NOT NULL;
