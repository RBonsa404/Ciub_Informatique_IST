-- ============================================================
-- V1__init_schema.sql
-- Schéma initial Club Informatique
-- Conforme au diagramme de classes (SINGLE_TABLE inheritance)
-- ============================================================

-- Extension UUID (pour génération future)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table : utilisateurs (SINGLE_TABLE inheritance)
-- Couvre : Membre, Formateur, ResponsableClub, Administrateur, SuperAdmin, DSI
-- ============================================================
CREATE TABLE utilisateurs (
    id                      BIGSERIAL PRIMARY KEY,
    dtype                   VARCHAR(30) NOT NULL,          -- discriminateur JPA
    nom                     VARCHAR(100) NOT NULL,
    prenom                  VARCHAR(100) NOT NULL,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe            VARCHAR(255) NOT NULL,
    date_creation           TIMESTAMP NOT NULL DEFAULT NOW(),
    statut                  VARCHAR(20) NOT NULL DEFAULT 'ACTIF'
                              CHECK (statut IN ('ACTIF', 'INACTIF', 'SUSPENDU')),
    photo                   VARCHAR(500),
    consentement_rgpd       BOOLEAN NOT NULL DEFAULT FALSE,
    totp_secret             VARCHAR(255),                  -- 2FA TOTP
    totp_enabled            BOOLEAN NOT NULL DEFAULT FALSE,

    -- Membre
    numero_membre           VARCHAR(50) UNIQUE,
    biographie              TEXT,
    date_adhesion           DATE,
    filiere                 VARCHAR(100),
    annee_etude             VARCHAR(20),

    -- Formateur
    specialite              VARCHAR(200),
    biographie_professionnelle TEXT,

    -- ResponsableClub
    fonction                VARCHAR(100),

    -- Administrateur / SuperAdmin / DSI
    niveau_acces            VARCHAR(50),

    -- Audit
    derniere_connexion      TIMESTAMP,
    reset_token             VARCHAR(255),
    reset_token_expiry      TIMESTAMP
);

CREATE INDEX idx_utilisateurs_email  ON utilisateurs(email);
CREATE INDEX idx_utilisateurs_dtype  ON utilisateurs(dtype);
CREATE INDEX idx_utilisateurs_statut ON utilisateurs(statut);

-- ============================================================
-- Table : roles
-- ============================================================
CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    nom         VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- ============================================================
-- Table : permissions
-- ============================================================
CREATE TABLE permissions (
    id      BIGSERIAL PRIMARY KEY,
    code    VARCHAR(100) NOT NULL UNIQUE,
    libelle VARCHAR(200)
);

-- ============================================================
-- Table d'association : utilisateurs_roles (M:N)
-- ============================================================
CREATE TABLE utilisateurs_roles (
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    role_id        BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (utilisateur_id, role_id)
);

-- ============================================================
-- Table d'association : roles_permissions (M:N)
-- ============================================================
CREATE TABLE roles_permissions (
    role_id       BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- Table : categories
-- ============================================================
CREATE TABLE categories (
    id          BIGSERIAL PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ============================================================
-- Table : actualites
-- ============================================================
CREATE TABLE actualites (
    id                BIGSERIAL PRIMARY KEY,
    titre             VARCHAR(300) NOT NULL,
    contenu           TEXT NOT NULL,
    image_url         VARCHAR(500),
    date_creation     TIMESTAMP NOT NULL DEFAULT NOW(),
    date_publication  TIMESTAMP,
    statut            VARCHAR(20) NOT NULL DEFAULT 'BROUILLON'
                        CHECK (statut IN ('BROUILLON', 'PUBLIE', 'ARCHIVE')),
    auteur_id         BIGINT NOT NULL REFERENCES utilisateurs(id),
    categorie_id      BIGINT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_actualites_statut         ON actualites(statut);
CREATE INDEX idx_actualites_date_pub       ON actualites(date_publication DESC);

-- ============================================================
-- Table : evenements
-- ============================================================
CREATE TABLE evenements (
    id              BIGSERIAL PRIMARY KEY,
    titre           VARCHAR(300) NOT NULL,
    description     TEXT,
    date_debut      TIMESTAMP NOT NULL,
    date_fin        TIMESTAMP,
    lieu            VARCHAR(300),
    capacite_max    INTEGER CHECK (capacite_max > 0),
    statut          VARCHAR(20) NOT NULL DEFAULT 'PLANIFIE'
                      CHECK (statut IN ('PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE')),
    image_url       VARCHAR(500),
    organisateur_id BIGINT NOT NULL REFERENCES utilisateurs(id),
    categorie_id    BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    date_creation   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evenements_statut     ON evenements(statut);
CREATE INDEX idx_evenements_date_debut ON evenements(date_debut);

-- ============================================================
-- Table : formations
-- ============================================================
CREATE TABLE formations (
    id            BIGSERIAL PRIMARY KEY,
    titre         VARCHAR(300) NOT NULL,
    description   TEXT,
    niveau        VARCHAR(50),
    duree         INTEGER CHECK (duree > 0),       -- en heures
    statut        VARCHAR(20) NOT NULL DEFAULT 'BROUILLON'
                    CHECK (statut IN ('BROUILLON', 'PUBLIE', 'ARCHIVE')),
    image_url     VARCHAR(500),
    formateur_id  BIGINT NOT NULL REFERENCES utilisateurs(id),
    categorie_id  BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_formations_statut ON formations(statut);

-- ============================================================
-- Table : sessions_formation
-- ============================================================
CREATE TABLE sessions_formation (
    id           BIGSERIAL PRIMARY KEY,
    formation_id BIGINT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
    date_debut   TIMESTAMP NOT NULL,
    date_fin     TIMESTAMP,
    lieu         VARCHAR(300),
    capacite_max INTEGER CHECK (capacite_max > 0),
    statut       VARCHAR(20) NOT NULL DEFAULT 'PLANIFIEE'
                   CHECK (statut IN ('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'))
);

CREATE INDEX idx_sessions_formation_id ON sessions_formation(formation_id);

-- ============================================================
-- Table : devoirs
-- ============================================================
CREATE TABLE devoirs (
    id           BIGSERIAL PRIMARY KEY,
    formation_id BIGINT NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
    titre        VARCHAR(300) NOT NULL,
    description  TEXT,
    date_limite  TIMESTAMP,
    statut       VARCHAR(20) NOT NULL DEFAULT 'PUBLIE'
                   CHECK (statut IN ('BROUILLON', 'PUBLIE', 'FERME')),
    date_creation TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table : ressources
-- ============================================================
CREATE TABLE ressources (
    id           BIGSERIAL PRIMARY KEY,
    titre        VARCHAR(300) NOT NULL,
    type         VARCHAR(50),                   -- PDF, LIEN, VIDEO, etc.
    url          VARCHAR(500) NOT NULL,
    date_ajout   TIMESTAMP NOT NULL DEFAULT NOW(),
    visibilite   VARCHAR(20) NOT NULL DEFAULT 'PUBLIC'
                   CHECK (visibilite IN ('PUBLIC', 'MEMBRE')),
    formation_id BIGINT REFERENCES formations(id) ON DELETE SET NULL,
    auteur_id    BIGINT REFERENCES utilisateurs(id),
    categorie_id BIGINT REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_ressources_visibilite ON ressources(visibilite);

-- ============================================================
-- Table : projets
-- ============================================================
CREATE TABLE projets (
    id               BIGSERIAL PRIMARY KEY,
    titre            VARCHAR(300) NOT NULL,
    description      TEXT,
    date_soumission  TIMESTAMP NOT NULL DEFAULT NOW(),
    statut           VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE'
                       CHECK (statut IN ('EN_ATTENTE', 'VALIDE', 'REJETE', 'EN_COURS', 'TERMINE')),
    lien_depot       VARCHAR(500),
    soumetteur_id    BIGINT REFERENCES utilisateurs(id),
    encadrant_id     BIGINT REFERENCES utilisateurs(id),
    image_url        VARCHAR(500)
);

CREATE INDEX idx_projets_statut ON projets(statut);

-- ============================================================
-- Table d'association : projets_membres (M:N)
-- ============================================================
CREATE TABLE projets_membres (
    projet_id      BIGINT NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
    utilisateur_id BIGINT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    PRIMARY KEY (projet_id, utilisateur_id)
);

-- ============================================================
-- Table : inscriptions
-- ============================================================
CREATE TABLE inscriptions (
    id               BIGSERIAL PRIMARY KEY,
    utilisateur_id   BIGINT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    evenement_id     BIGINT REFERENCES evenements(id) ON DELETE CASCADE,
    session_id       BIGINT REFERENCES sessions_formation(id) ON DELETE CASCADE,
    date_inscription TIMESTAMP NOT NULL DEFAULT NOW(),
    statut           VARCHAR(20) NOT NULL DEFAULT 'ACCEPTE'
                       CHECK (statut IN ('EN_ATTENTE', 'ACCEPTE', 'REFUSE', 'ANNULE')),
    CONSTRAINT inscription_target CHECK (
        (evenement_id IS NOT NULL AND session_id IS NULL) OR
        (evenement_id IS NULL AND session_id IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_inscription_user_event   ON inscriptions(utilisateur_id, evenement_id) WHERE evenement_id IS NOT NULL;
CREATE UNIQUE INDEX idx_inscription_user_session ON inscriptions(utilisateur_id, session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_inscriptions_user_id ON inscriptions(utilisateur_id);

-- ============================================================
-- Table : presences
-- ============================================================
CREATE TABLE presences (
    id             BIGSERIAL PRIMARY KEY,
    inscription_id BIGINT NOT NULL REFERENCES inscriptions(id) ON DELETE CASCADE,
    session_id     BIGINT REFERENCES sessions_formation(id) ON DELETE CASCADE,
    date_presence  TIMESTAMP NOT NULL DEFAULT NOW(),
    present        BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (inscription_id, session_id)
);

-- ============================================================
-- Table : notifications
-- ============================================================
CREATE TABLE notifications (
    id             BIGSERIAL PRIMARY KEY,
    destinataire_id BIGINT NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    titre          VARCHAR(300) NOT NULL,
    message        TEXT NOT NULL,
    date_envoi     TIMESTAMP NOT NULL DEFAULT NOW(),
    lu             BOOLEAN NOT NULL DEFAULT FALSE,
    type           VARCHAR(50) DEFAULT 'INFO'    -- INFO, SUCCES, AVERTISSEMENT, GLOBAL
);

CREATE INDEX idx_notifications_destinataire ON notifications(destinataire_id);
CREATE INDEX idx_notifications_lu           ON notifications(destinataire_id, lu);

-- ============================================================
-- Table : messages_contact
-- ============================================================
CREATE TABLE messages_contact (
    id          BIGSERIAL PRIMARY KEY,
    nom         VARCHAR(200) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    sujet       VARCHAR(300) NOT NULL,
    message     TEXT NOT NULL,
    date_envoi  TIMESTAMP NOT NULL DEFAULT NOW(),
    traite      BOOLEAN NOT NULL DEFAULT FALSE,
    traite_par  BIGINT REFERENCES utilisateurs(id) ON DELETE SET NULL
);

CREATE INDEX idx_messages_contact_traite ON messages_contact(traite);

-- ============================================================
-- Table : audit_logs (journalisation sécurité)
-- ============================================================
CREATE TABLE audit_logs (
    id             BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT REFERENCES utilisateurs(id) ON DELETE SET NULL,
    action         VARCHAR(100) NOT NULL,
    details        TEXT,
    ip_masquee     VARCHAR(50),               -- ex. 192.168.1.xxx
    timestamp      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user      ON audit_logs(utilisateur_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
