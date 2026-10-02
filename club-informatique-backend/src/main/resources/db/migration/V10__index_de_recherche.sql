-- ===================================================================
-- V10 : index manquants
-- Colonnes de jointure et de filtre qui n'en avaient pas (mesures : docs/performance.md).
-- ===================================================================

-- Comptes par rôle (liste de l'administration, statistiques, notifications au Responsable).
CREATE INDEX idx_utilisateur_role_role ON utilisateur_role (role_id);

-- Formations d'un formateur (espace Formateur, conflits de planning).
CREATE INDEX idx_formation_formateur ON formation (formateur_id) WHERE deleted_at IS NULL;

-- Séances d'un formateur sur un créneau, rappels de la veille.
CREATE INDEX idx_session_formation_dates ON session_formation (formation_id, date_debut) WHERE deleted_at IS NULL;

-- Filtres par catégorie des listes publiques.
CREATE INDEX idx_actualite_categorie ON actualite (categorie_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_evenement_categorie ON evenement (categorie_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_formation_categorie ON formation (categorie_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projet_categorie ON projet (categorie_id) WHERE deleted_at IS NULL;

-- Actualités publiées, des plus récentes aux plus anciennes (page d'accueil, liste publique).
CREATE INDEX idx_actualite_publiees ON actualite (visibilite, date_publication DESC) WHERE publie AND deleted_at IS NULL;

-- Jetons de session et jetons à usage unique expirés : purge périodique.
CREATE INDEX idx_refresh_token_expiration ON refresh_token (date_expiration);
CREATE INDEX idx_jeton_usage_unique_expiration ON jeton_usage_unique (expire_le);
