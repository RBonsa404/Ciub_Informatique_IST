-- ===================================================================
-- V3 : comptes techniques
-- 1. Le compte créé par V2 portait un mot de passe publié dans le dépôt : il est retiré.
--    Suppression logique (les contenus qui le référencent sont conservés), rôles et sessions retirés,
--    mot de passe remplacé par une valeur qu'aucune saisie ne peut vérifier.
-- 2. Indicateur des comptes de test et obligation de changement de mot de passe.
-- Le premier Super Admin réel est créé au démarrage à partir des variables d'environnement.
-- ===================================================================

DELETE FROM utilisateur_role
WHERE utilisateur_id IN (SELECT id FROM utilisateur WHERE email = 'admin@clubinfo-ist.ci');

DELETE FROM refresh_token
WHERE utilisateur_id IN (SELECT id FROM utilisateur WHERE email = 'admin@clubinfo-ist.ci');

UPDATE utilisateur
SET deleted_at = NOW(),
    updated_at = NOW(),
    statut = 'INACTIF',
    mot_de_passe = '!',
    totp_secret = NULL,
    totp_active = FALSE
WHERE email = 'admin@clubinfo-ist.ci';

ALTER TABLE utilisateur ADD COLUMN test BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE utilisateur ADD COLUMN changement_mot_de_passe_requis BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_utilisateur_test ON utilisateur(test) WHERE test;
CREATE INDEX idx_audit_log_statut ON audit_log(statut);
