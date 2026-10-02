-- ===================================================================
-- V5 : authentification et comptes
-- ===================================================================

-- 1. Sessions : seule l'empreinte du jeton de rafraîchissement est conservée.
--    Les jetons existants, stockés en clair, sont retirés : les sessions ouvertes devront se reconnecter.
DELETE FROM refresh_token;
ALTER TABLE refresh_token RENAME COLUMN token TO empreinte;
ALTER TABLE refresh_token DROP COLUMN remplace_par;
ALTER TABLE refresh_token ADD COLUMN revoque_le TIMESTAMP;
ALTER TABLE refresh_token ADD COLUMN persistant BOOLEAN NOT NULL DEFAULT FALSE;
ALTER INDEX IF EXISTS idx_refresh_token_token RENAME TO idx_refresh_token_empreinte;

-- 2. Jetons à usage unique (vérification d'adresse, réinitialisation, invitation) : empreinte seule, durée limitée.
CREATE TABLE jeton_usage_unique (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('VERIFICATION', 'REINITIALISATION', 'INVITATION')),
    empreinte VARCHAR(64) NOT NULL UNIQUE,
    expire_le TIMESTAMP NOT NULL,
    utilise_le TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jeton_usage_unique_utilisateur ON jeton_usage_unique(utilisateur_id, type);

-- 3. Compte : la double authentification n'existe pas dans le produit ; vérification d'adresse, consentement,
--    préférence de notification et version de session (toute élévation invalide les jetons d'accès déjà émis).
ALTER TABLE utilisateur DROP COLUMN totp_secret;
ALTER TABLE utilisateur DROP COLUMN totp_active;
ALTER TABLE utilisateur ADD COLUMN email_verifie_le TIMESTAMP;
ALTER TABLE utilisateur ADD COLUMN consentement_le TIMESTAMP;
ALTER TABLE utilisateur ADD COLUMN notifications_courriel BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE utilisateur ADD COLUMN version_session INT NOT NULL DEFAULT 0;

UPDATE utilisateur SET email_verifie_le = created_at WHERE statut = 'ACTIF' AND deleted_at IS NULL;

-- 4. Une adresse n'est unique que parmi les comptes non supprimés : elle redevient disponible après une suppression.
ALTER TABLE utilisateur DROP CONSTRAINT IF EXISTS utilisateur_email_key;
DROP INDEX IF EXISTS idx_utilisateur_email;
CREATE UNIQUE INDEX uq_utilisateur_email_actif ON utilisateur (LOWER(email)) WHERE deleted_at IS NULL;
CREATE INDEX idx_utilisateur_email ON utilisateur (email);

-- 5. Numéros de membre attribués par une séquence, à la suite du plus grand numéro déjà attribué.
CREATE SEQUENCE numero_membre_seq;
SELECT setval('numero_membre_seq',
              COALESCE((SELECT MAX(CAST(SUBSTRING(numero_membre FROM '[0-9]+$') AS BIGINT))
                        FROM utilisateur WHERE numero_membre ~ '[0-9]+$'), 0) + 1,
              FALSE);

-- 6. Le statut « EN_ATTENTE_ACTIVATION » compte 21 caractères : la colonne ne pouvait pas le recevoir.
ALTER TABLE utilisateur ALTER COLUMN statut TYPE VARCHAR(30);
