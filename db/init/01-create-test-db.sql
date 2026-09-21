-- Exécuté automatiquement par l'image Postgres au premier démarrage du
-- conteneur (docker-entrypoint-initdb.d) : crée la base dédiée aux tests
-- d'intégration, séparée de la base de développement.
CREATE DATABASE club_informatique_test OWNER club_info;
