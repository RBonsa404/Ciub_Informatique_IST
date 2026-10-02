-- ===================================================================
-- V8 : projets
-- ===================================================================

-- La décision du Responsable (validation ou rejet) est conservée avec son motif et sa date :
-- le porteur d'une proposition rejetée doit pouvoir en lire la raison.
ALTER TABLE projet ADD COLUMN motif_decision VARCHAR(1000);
ALTER TABLE projet ADD COLUMN date_decision TIMESTAMP;

CREATE INDEX idx_projet_porteur ON projet (porteur_id) WHERE deleted_at IS NULL;
