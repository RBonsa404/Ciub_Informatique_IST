-- =============================================================================
-- V1 -- Schéma initial de la plateforme Club Informatique
-- Auteur : OUARE Arnaud (squelette transverse, section 2.6 du document de
--          dispatch d'architecture). Chaque module owner complète son
--          domaine dans une migration ultérieure (V2, V3, ...) plutôt que
--          de modifier ce fichier une fois qu'il est passé en develop.
-- Conventions (section 4.5) : tables en snake_case, PK id BIGSERIAL,
-- FK <table>_id BIGINT NOT NULL.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Identité / RBAC (module PAMOUSSO)
-- ---------------------------------------------------------------------------
CREATE TABLE utilisateur (
    id                  BIGSERIAL PRIMARY KEY,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe        VARCHAR(255) NOT NULL,
    telephone           VARCHAR(30),
    photo_url           VARCHAR(500),
    biographie          TEXT,
    actif               BOOLEAN NOT NULL DEFAULT TRUE,
    deux_fa_active      BOOLEAN NOT NULL DEFAULT FALSE,
    deux_fa_secret      VARCHAR(255),
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_maj            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,   -- VISITEUR, MEMBRE, FORMATEUR, RESP_CLUB, ADMIN, SUPER_ADMIN, DSI
    libelle     VARCHAR(150) NOT NULL
);

CREATE TABLE permission (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(100) NOT NULL UNIQUE,
    libelle     VARCHAR(255) NOT NULL
);

CREATE TABLE utilisateur_role (
    utilisateur_id  BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    role_id         BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    PRIMARY KEY (utilisateur_id, role_id)
);

CREATE TABLE role_permission (
    role_id         BIGINT NOT NULL REFERENCES role(id) ON DELETE CASCADE,
    permission_id   BIGINT NOT NULL REFERENCES permission(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------------------
-- Actualités (module KI)
-- ---------------------------------------------------------------------------
CREATE TABLE actualite (
    id                  BIGSERIAL PRIMARY KEY,
    titre               VARCHAR(255) NOT NULL,
    contenu             TEXT NOT NULL,
    auteur_id           BIGINT NOT NULL REFERENCES utilisateur(id),
    publie              BOOLEAN NOT NULL DEFAULT FALSE,
    date_publication    TIMESTAMPTZ,
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Événements (module BONSA)
-- ---------------------------------------------------------------------------
CREATE TABLE evenement (
    id                  BIGSERIAL PRIMARY KEY,
    titre               VARCHAR(255) NOT NULL,
    description         TEXT,
    lieu                VARCHAR(255),
    date_debut          TIMESTAMPTZ NOT NULL,
    date_fin            TIMESTAMPTZ,
    capacite_max        INTEGER CHECK (capacite_max IS NULL OR capacite_max > 0),
    organisateur_id     BIGINT NOT NULL REFERENCES utilisateur(id),
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Formations (module SALOU)
-- ---------------------------------------------------------------------------
CREATE TABLE formation (
    id                  BIGSERIAL PRIMARY KEY,
    titre               VARCHAR(255) NOT NULL,
    description         TEXT,
    formateur_id        BIGINT NOT NULL REFERENCES utilisateur(id),
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE session_formation (
    id                  BIGSERIAL PRIMARY KEY,
    formation_id        BIGINT NOT NULL REFERENCES formation(id) ON DELETE CASCADE,
    date_session        TIMESTAMPTZ NOT NULL,
    lieu                VARCHAR(255),
    capacite_max        INTEGER CHECK (capacite_max IS NULL OR capacite_max > 0)
);

-- ---------------------------------------------------------------------------
-- Inscriptions & présence (transverse événement/formation)
-- ---------------------------------------------------------------------------
CREATE TABLE inscription (
    id                      BIGSERIAL PRIMARY KEY,
    membre_id               BIGINT NOT NULL REFERENCES utilisateur(id),
    evenement_id            BIGINT REFERENCES evenement(id) ON DELETE CASCADE,
    session_formation_id    BIGINT REFERENCES session_formation(id) ON DELETE CASCADE,
    statut                  VARCHAR(30) NOT NULL DEFAULT 'CONFIRMEE',
    date_inscription        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_inscription_cible CHECK (
        (evenement_id IS NOT NULL AND session_formation_id IS NULL) OR
        (evenement_id IS NULL AND session_formation_id IS NOT NULL)
    ),
    CONSTRAINT uq_inscription_evenement UNIQUE (membre_id, evenement_id),
    CONSTRAINT uq_inscription_session UNIQUE (membre_id, session_formation_id)
);

CREATE TABLE presence (
    id                      BIGSERIAL PRIMARY KEY,
    inscription_id          BIGINT NOT NULL REFERENCES inscription(id) ON DELETE CASCADE,
    present                 BOOLEAN NOT NULL DEFAULT FALSE,
    enregistre_par_id       BIGINT NOT NULL REFERENCES utilisateur(id),
    date_enregistrement     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Projets & ressources (module KI / transverse)
-- ---------------------------------------------------------------------------
CREATE TABLE projet (
    id                  BIGSERIAL PRIMARY KEY,
    titre               VARCHAR(255) NOT NULL,
    description         TEXT,
    membre_id           BIGINT NOT NULL REFERENCES utilisateur(id),
    statut              VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',  -- EN_ATTENTE, VALIDE, REJETE
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE proposition (
    id                  BIGSERIAL PRIMARY KEY,
    projet_id           BIGINT NOT NULL REFERENCES projet(id) ON DELETE CASCADE,
    commentaire         TEXT,
    valide_par_id       BIGINT REFERENCES utilisateur(id),
    date_decision       TIMESTAMPTZ
);

CREATE TABLE ressource (
    id                  BIGSERIAL PRIMARY KEY,
    formation_id        BIGINT REFERENCES formation(id) ON DELETE CASCADE,
    titre               VARCHAR(255) NOT NULL,
    url                 VARCHAR(500),
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devoir (
    id                  BIGSERIAL PRIMARY KEY,
    formation_id        BIGINT NOT NULL REFERENCES formation(id) ON DELETE CASCADE,
    titre               VARCHAR(255) NOT NULL,
    consigne            TEXT,
    date_limite         TIMESTAMPTZ,
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Notifications & contact (module ZONGO)
-- ---------------------------------------------------------------------------
CREATE TABLE notification (
    id                  BIGSERIAL PRIMARY KEY,
    destinataire_id     BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    titre               VARCHAR(255) NOT NULL,
    message             TEXT NOT NULL,
    lue                 BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE message_contact (
    id                  BIGSERIAL PRIMARY KEY,
    nom                 VARCHAR(150) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    sujet               VARCHAR(255),
    message             TEXT NOT NULL,
    traite              BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Index utiles
-- ---------------------------------------------------------------------------
CREATE INDEX idx_evenement_date_debut ON evenement(date_debut);
CREATE INDEX idx_session_formation_date ON session_formation(date_session);
CREATE INDEX idx_inscription_membre ON inscription(membre_id);
CREATE INDEX idx_notification_destinataire ON notification(destinataire_id, lue);
CREATE INDEX idx_projet_statut ON projet(statut);
