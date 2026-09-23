-- ===================================================================
-- Migration Flyway V1 : Création complète du schéma de base de données
-- Plateforme Club Informatique IST
-- ===================================================================

-- 1. Table : utilisateur
CREATE TABLE IF NOT EXISTS utilisateur (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    date_naissance DATE,
    filiere VARCHAR(100),
    annee_etude INT,
    photo VARCHAR(500),
    biographie VARCHAR(500),
    specialite VARCHAR(200),
    fonction VARCHAR(100),
    numero_membre VARCHAR(20) UNIQUE,
    date_adhesion DATE,
    statut VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    tentatives_connexion INT DEFAULT 0,
    verrouille_jusqua TIMESTAMP,
    totp_secret VARCHAR(255),
    totp_active BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_utilisateur_email ON utilisateur(email);
CREATE INDEX IF NOT EXISTS idx_utilisateur_statut ON utilisateur(statut);
CREATE INDEX IF NOT EXISTS idx_utilisateur_deleted_at ON utilisateur(deleted_at);

-- 2. Table : role
CREATE TABLE IF NOT EXISTS role (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    nom VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_role_nom ON role(nom);

-- 3. Table : permission
CREATE TABLE IF NOT EXISTS permission (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    code VARCHAR(100) NOT NULL UNIQUE,
    libelle VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_permission_code ON permission(code);

-- 4. Table de jointure : role_permission
CREATE TABLE IF NOT EXISTS role_permission (
    role_id BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 5. Table de jointure : utilisateur_role
CREATE TABLE IF NOT EXISTS utilisateur_role (
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    PRIMARY KEY (utilisateur_id, role_id)
);

-- 6. Table : refresh_token
CREATE TABLE IF NOT EXISTS refresh_token (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    token VARCHAR(255) NOT NULL UNIQUE,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    date_expiration TIMESTAMP NOT NULL,
    revoque BOOLEAN NOT NULL DEFAULT FALSE,
    remplace_par VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_token ON refresh_token(token);
CREATE INDEX IF NOT EXISTS idx_refresh_token_user_id ON refresh_token(utilisateur_id);

-- 7. Table : categorie
CREATE TABLE IF NOT EXISTS categorie (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    nom VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description VARCHAR(500),
    couleur VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_categorie_nom ON categorie(nom);
CREATE INDEX IF NOT EXISTS idx_categorie_slug ON categorie(slug);
CREATE INDEX IF NOT EXISTS idx_categorie_deleted_at ON categorie(deleted_at);

-- 8. Table : actualite
CREATE TABLE IF NOT EXISTS actualite (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    titre VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    contenu TEXT NOT NULL,
    resume VARCHAR(500),
    image VARCHAR(500),
    publie BOOLEAN NOT NULL DEFAULT FALSE,
    date_publication TIMESTAMP,
    auteur_id BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL,
    categorie_id BIGINT REFERENCES categorie(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_actualite_slug ON actualite(slug);
CREATE INDEX IF NOT EXISTS idx_actualite_publie ON actualite(publie);
CREATE INDEX IF NOT EXISTS idx_actualite_date_pub ON actualite(date_publication);
CREATE INDEX IF NOT EXISTS idx_actualite_deleted_at ON actualite(deleted_at);

-- 9. Table : evenement
CREATE TABLE IF NOT EXISTS evenement (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    titre VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL,
    lieu VARCHAR(200) NOT NULL,
    capacite_max INT,
    image VARCHAR(500),
    publie BOOLEAN NOT NULL DEFAULT FALSE,
    categorie_id BIGINT REFERENCES categorie(id) ON DELETE SET NULL,
    organisateur_id BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_evenement_slug ON evenement(slug);
CREATE INDEX IF NOT EXISTS idx_evenement_date_debut ON evenement(date_debut);
CREATE INDEX IF NOT EXISTS idx_evenement_publie ON evenement(publie);
CREATE INDEX IF NOT EXISTS idx_evenement_deleted_at ON evenement(deleted_at);

-- 10. Table : formation
CREATE TABLE IF NOT EXISTS formation (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    titre VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    niveau VARCHAR(30) NOT NULL DEFAULT 'DEBUTANT',
    prerequis VARCHAR(500),
    objectifs TEXT,
    publie BOOLEAN NOT NULL DEFAULT FALSE,
    image VARCHAR(500),
    formateur_id BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL,
    categorie_id BIGINT REFERENCES categorie(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_formation_slug ON formation(slug);
CREATE INDEX IF NOT EXISTS idx_formation_publie ON formation(publie);
CREATE INDEX IF NOT EXISTS idx_formation_niveau ON formation(niveau);
CREATE INDEX IF NOT EXISTS idx_formation_deleted_at ON formation(deleted_at);

-- 11. Table : session_formation
CREATE TABLE IF NOT EXISTS session_formation (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    formation_id BIGINT NOT NULL REFERENCES formation(id) ON DELETE CASCADE,
    date_debut TIMESTAMP NOT NULL,
    date_fin TIMESTAMP NOT NULL,
    lieu VARCHAR(200),
    lien_visio VARCHAR(500),
    capacite_max INT,
    statut VARCHAR(30) NOT NULL DEFAULT 'PLANIFIEE'
);

CREATE INDEX IF NOT EXISTS idx_session_formation_id ON session_formation(formation_id);
CREATE INDEX IF NOT EXISTS idx_session_date_debut ON session_formation(date_debut);
CREATE INDEX IF NOT EXISTS idx_session_statut ON session_formation(statut);
CREATE INDEX IF NOT EXISTS idx_session_deleted_at ON session_formation(deleted_at);

-- 12. Table : devoir
CREATE TABLE IF NOT EXISTS devoir (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    formation_id BIGINT NOT NULL REFERENCES formation(id) ON DELETE CASCADE,
    titre VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    date_limite TIMESTAMP NOT NULL,
    fichier_consigne VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_devoir_formation_id ON devoir(formation_id);
CREATE INDEX IF NOT EXISTS idx_devoir_date_limite ON devoir(date_limite);
CREATE INDEX IF NOT EXISTS idx_devoir_deleted_at ON devoir(deleted_at);

-- 13. Table : inscription
CREATE TABLE IF NOT EXISTS inscription (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    evenement_id BIGINT REFERENCES evenement(id) ON DELETE CASCADE,
    session_formation_id BIGINT REFERENCES session_formation(id) ON DELETE CASCADE,
    date_inscription TIMESTAMP NOT NULL DEFAULT NOW(),
    statut VARCHAR(30) NOT NULL DEFAULT 'CONFIRMEE',
    motif_annulation VARCHAR(500),
    CONSTRAINT chk_inscription_cible CHECK (evenement_id IS NOT NULL OR session_formation_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_inscription_utilisateur ON inscription(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_inscription_evenement ON inscription(evenement_id);
CREATE INDEX IF NOT EXISTS idx_inscription_session ON inscription(session_formation_id);
CREATE INDEX IF NOT EXISTS idx_inscription_statut ON inscription(statut);
CREATE INDEX IF NOT EXISTS idx_inscription_deleted_at ON inscription(deleted_at);

-- 14. Table : presence
CREATE TABLE IF NOT EXISTS presence (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    inscription_id BIGINT NOT NULL REFERENCES inscription(id) ON DELETE CASCADE,
    session_formation_id BIGINT NOT NULL REFERENCES session_formation(id) ON DELETE CASCADE,
    statut VARCHAR(20) NOT NULL DEFAULT 'PRESENT',
    date_pointage TIMESTAMP DEFAULT NOW(),
    remarque VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_presence_inscription ON presence(inscription_id);
CREATE INDEX IF NOT EXISTS idx_presence_session ON presence(session_formation_id);
CREATE INDEX IF NOT EXISTS idx_presence_statut ON presence(statut);

-- 15. Table : projet
CREATE TABLE IF NOT EXISTS projet (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    titre VARCHAR(200) NOT NULL,
    slug VARCHAR(250) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    objectifs TEXT,
    technologies VARCHAR(500),
    depot_git VARCHAR(500),
    documentation_url VARCHAR(500),
    statut VARCHAR(30) NOT NULL DEFAULT 'PROPOSE',
    porteur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    suivi_formateur TEXT,
    avancement_pourcentage INT DEFAULT 0,
    categorie_id BIGINT REFERENCES categorie(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_projet_slug ON projet(slug);
CREATE INDEX IF NOT EXISTS idx_projet_statut ON projet(statut);
CREATE INDEX IF NOT EXISTS idx_projet_deleted_at ON projet(deleted_at);

-- 16. Table : projet_membre
CREATE TABLE IF NOT EXISTS projet_membre (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    projet_id BIGINT NOT NULL REFERENCES projet(id) ON DELETE CASCADE,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'CONTRIBUTEUR',
    date_rejoint TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_projet_membre UNIQUE (projet_id, utilisateur_id)
);

CREATE INDEX IF NOT EXISTS idx_projet_membre_projet ON projet_membre(projet_id);
CREATE INDEX IF NOT EXISTS idx_projet_membre_user ON projet_membre(utilisateur_id);

-- 17. Table : ressource
CREATE TABLE IF NOT EXISTS ressource (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(30) NOT NULL DEFAULT 'DOCUMENT_PDF',
    url_fichier VARCHAR(500) NOT NULL,
    est_publique BOOLEAN NOT NULL DEFAULT TRUE,
    formation_id BIGINT REFERENCES formation(id) ON DELETE SET NULL,
    categorie_id BIGINT REFERENCES categorie(id) ON DELETE SET NULL,
    auteur_id BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ressource_publique ON ressource(est_publique);
CREATE INDEX IF NOT EXISTS idx_ressource_type ON ressource(type);
CREATE INDEX IF NOT EXISTS idx_ressource_formation ON ressource(formation_id);
CREATE INDEX IF NOT EXISTS idx_ressource_deleted_at ON ressource(deleted_at);

-- 18. Table : notification
CREATE TABLE IF NOT EXISTS notification (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    destinataire_id BIGINT REFERENCES utilisateur(id) ON DELETE CASCADE,
    titre VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'SYSTEME',
    lien VARCHAR(500),
    lue BOOLEAN NOT NULL DEFAULT FALSE,
    date_lecture TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_destinataire ON notification(destinataire_id);
CREATE INDEX IF NOT EXISTS idx_notification_lue ON notification(lue);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);

-- 19. Table : message_contact
CREATE TABLE IF NOT EXISTS message_contact (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    sujet VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    traite BOOLEAN NOT NULL DEFAULT FALSE,
    date_reponse TIMESTAMP,
    reponse_par_id BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_traite ON message_contact(traite);
CREATE INDEX IF NOT EXISTS idx_contact_created_at ON message_contact(created_at);

-- 20. Table : page_info
CREATE TABLE IF NOT EXISTS page_info (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    slug VARCHAR(100) NOT NULL UNIQUE,
    titre VARCHAR(200) NOT NULL,
    contenu TEXT NOT NULL,
    modifie_par_id BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_page_slug ON page_info(slug);

-- 21. Table : audit_log
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    utilisateur_email VARCHAR(255),
    ip_address VARCHAR(50),
    entite_concernee VARCHAR(100),
    entite_id BIGINT,
    date_action TIMESTAMP NOT NULL DEFAULT NOW(),
    statut VARCHAR(20) DEFAULT 'SUCCES'
);

CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(date_action);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(utilisateur_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
