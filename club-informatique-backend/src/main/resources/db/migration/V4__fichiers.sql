-- ===================================================================
-- V4 : métadonnées des fichiers déposés
-- Le contenu est conservé par le service de stockage (dossier ou stockage objet) sous la clé.
-- ===================================================================

CREATE TABLE fichier (
    id VARCHAR(36) PRIMARY KEY,
    cle VARCHAR(255) NOT NULL UNIQUE,
    nom VARCHAR(255) NOT NULL,
    type_mime VARCHAR(100) NOT NULL,
    taille_octets BIGINT NOT NULL CHECK (taille_octets > 0),
    acces VARCHAR(20) NOT NULL DEFAULT 'PRIVE' CHECK (acces IN ('PRIVE', 'MEMBRES', 'PUBLIC')),
    deposant_id BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fichier_deposant ON fichier(deposant_id);
