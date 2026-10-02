-- ===================================================================
-- V9 : administration et exploitation
-- ===================================================================

-- 1. Réglages de la plateforme : conservés en base, ils survivent au redémarrage.
--    Une clé absente prend la valeur par défaut de la configuration.
CREATE TABLE parametre_systeme (
    cle VARCHAR(100) PRIMARY KEY,
    valeur VARCHAR(500) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Sauvegardes : chaque exécution du script de sauvegarde y inscrit son résultat.
--    L'application ne fait que lire cette table.
CREATE TABLE sauvegarde (
    id BIGSERIAL PRIMARY KEY,
    effectuee_le TIMESTAMP NOT NULL DEFAULT NOW(),
    taille_octets BIGINT,
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('REUSSIE', 'ECHOUEE')),
    detail VARCHAR(500)
);

CREATE INDEX idx_sauvegarde_date ON sauvegarde (effectuee_le DESC);

-- 3. Journal : recherche des échecs récents par action.
CREATE INDEX idx_audit_log_action_date ON audit_log (action, date_action);
