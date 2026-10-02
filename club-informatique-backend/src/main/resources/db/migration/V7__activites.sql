-- ===================================================================
-- V7 : inscriptions, émargement, rappels
-- ===================================================================

-- 1. Un membre n'a qu'une inscription active par événement et par séance.
--    Les doublons éventuels sont annulés (la plus ancienne inscription est conservée) avant de poser la contrainte.
UPDATE inscription i SET statut = 'ANNULEE', motif_annulation = 'Inscription en double'
WHERE i.statut <> 'ANNULEE' AND i.deleted_at IS NULL AND i.evenement_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM inscription j
              WHERE j.utilisateur_id = i.utilisateur_id AND j.evenement_id = i.evenement_id
                AND j.statut <> 'ANNULEE' AND j.deleted_at IS NULL AND j.id < i.id);

UPDATE inscription i SET statut = 'ANNULEE', motif_annulation = 'Inscription en double'
WHERE i.statut <> 'ANNULEE' AND i.deleted_at IS NULL AND i.session_formation_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM inscription j
              WHERE j.utilisateur_id = i.utilisateur_id AND j.session_formation_id = i.session_formation_id
                AND j.statut <> 'ANNULEE' AND j.deleted_at IS NULL AND j.id < i.id);

CREATE UNIQUE INDEX uq_inscription_active_evenement ON inscription (utilisateur_id, evenement_id)
    WHERE statut <> 'ANNULEE' AND deleted_at IS NULL AND evenement_id IS NOT NULL;
CREATE UNIQUE INDEX uq_inscription_active_session ON inscription (utilisateur_id, session_formation_id)
    WHERE statut <> 'ANNULEE' AND deleted_at IS NULL AND session_formation_id IS NOT NULL;

-- 2. Compteurs d'inscrits : calculés en base sur les inscriptions confirmées.
CREATE INDEX idx_inscription_evenement_statut ON inscription (evenement_id, statut) WHERE deleted_at IS NULL;
CREATE INDEX idx_inscription_session_statut ON inscription (session_formation_id, statut) WHERE deleted_at IS NULL;

-- 3. Rappel envoyé la veille : une seule fois par inscription.
ALTER TABLE inscription ADD COLUMN rappel_envoye_le TIMESTAMP;

-- 4. Un seul pointage par inscription et par séance (le dernier enregistré est conservé).
DELETE FROM presence p
WHERE EXISTS (SELECT 1 FROM presence q
              WHERE q.inscription_id = p.inscription_id AND q.session_formation_id = p.session_formation_id AND q.id > p.id);
CREATE UNIQUE INDEX uq_presence_inscription_session ON presence (inscription_id, session_formation_id);

-- 5. Notifications : lecture par destinataire, de la plus récente à la plus ancienne.
CREATE INDEX idx_notification_destinataire_date ON notification (destinataire_id, created_at DESC);
