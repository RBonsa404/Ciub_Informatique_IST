-- Données de référence pour l'environnement de développement local.
-- Ne fait PAS partie des migrations Flyway (backend/src/main/resources/db/migration) :
-- à exécuter manuellement après le démarrage de l'app (qui aura créé le schéma), ex. :
--   psql -h localhost -U club_info -d club_informatique -f db/seeds/seed_dev.sql

INSERT INTO role (code, libelle) VALUES
    ('VISITEUR', 'Visiteur'),
    ('MEMBRE', 'Membre / Étudiant'),
    ('FORMATEUR', 'Formateur / Responsable d''activité'),
    ('RESP_CLUB', 'Responsable du Club'),
    ('ADMIN', 'Administrateur'),
    ('SUPER_ADMIN', 'Super Administrateur'),
    ('DSI', 'Direction des Systèmes d''Information')
ON CONFLICT (code) DO NOTHING;

-- Compte admin de dev (mot de passe : à définir par PAMOUSSO une fois
-- l'inscription/hash BCrypt branchés -- ne pas committer de hash ici).
