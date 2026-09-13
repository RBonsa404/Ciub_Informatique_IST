-- ============================================================
-- V2__seed_data.sql
-- Données de démonstration — couvre tous les rôles
-- ============================================================
-- Mots de passe : Demo@1234 (bcrypt coût 12)
-- Hash généré : $2a$12$FIcPNpK0b1n4L5P4k2B9MuumQV7sxC4ULBI8zLt5fk3n/pJIHBRSi

-- ============================================================
-- Rôles système
-- ============================================================
INSERT INTO roles (nom, description) VALUES
    ('VISITEUR',          'Visiteur non authentifié — accès public uniquement'),
    ('MEMBRE',            'Membre inscrit du club'),
    ('FORMATEUR',         'Formateur ou responsable d''activité'),
    ('RESPONSABLE_CLUB',  'Membre du bureau responsable de la communication'),
    ('ADMINISTRATEUR',    'Administrateur technique du site'),
    ('SUPERADMIN',        'Super Administrateur — accès complet'),
    ('DSI',               'Directeur des Systèmes d''Information');

-- ============================================================
-- Permissions
-- ============================================================
INSERT INTO permissions (code, libelle) VALUES
    ('ACTUALITE_READ',          'Lire les actualités'),
    ('ACTUALITE_WRITE',         'Créer/modifier des actualités'),
    ('ACTUALITE_DELETE',        'Supprimer des actualités'),
    ('EVENEMENT_READ',          'Lire les événements'),
    ('EVENEMENT_WRITE',         'Créer/modifier des événements'),
    ('EVENEMENT_DELETE',        'Supprimer des événements'),
    ('FORMATION_READ',          'Lire les formations'),
    ('FORMATION_WRITE',         'Créer/modifier des formations'),
    ('FORMATION_DELETE',        'Supprimer des formations'),
    ('PROJET_READ',             'Lire les projets'),
    ('PROJET_WRITE',            'Créer/modifier des projets'),
    ('PROJET_DELETE',           'Supprimer des projets'),
    ('RESSOURCE_READ_PUBLIC',   'Lire les ressources publiques'),
    ('RESSOURCE_READ_MEMBRE',   'Lire les ressources membres'),
    ('RESSOURCE_WRITE',         'Créer/modifier des ressources'),
    ('USER_MANAGE',             'Gérer les utilisateurs'),
    ('ROLE_MANAGE',             'Gérer les rôles et permissions'),
    ('STATS_READ',              'Consulter les statistiques'),
    ('NOTIFICATION_BROADCAST',  'Envoyer des notifications globales'),
    ('PRESENCE_WRITE',          'Prendre les présences');

-- ============================================================
-- Associations rôles-permissions
-- ============================================================
-- RESPONSABLE_CLUB
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.nom = 'RESPONSABLE_CLUB'
  AND p.code IN ('ACTUALITE_READ','ACTUALITE_WRITE','ACTUALITE_DELETE',
                 'EVENEMENT_READ','EVENEMENT_WRITE','EVENEMENT_DELETE',
                 'PROJET_READ','PROJET_WRITE','PROJET_DELETE',
                 'RESSOURCE_READ_PUBLIC','RESSOURCE_READ_MEMBRE',
                 'NOTIFICATION_BROADCAST');

-- FORMATEUR
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.nom = 'FORMATEUR'
  AND p.code IN ('FORMATION_READ','FORMATION_WRITE',
                 'RESSOURCE_READ_PUBLIC','RESSOURCE_READ_MEMBRE','RESSOURCE_WRITE',
                 'PRESENCE_WRITE','PROJET_READ');

-- ADMINISTRATEUR (tous les droits)
INSERT INTO roles_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.nom IN ('ADMINISTRATEUR','SUPERADMIN','DSI');

-- ============================================================
-- Catégories
-- ============================================================
INSERT INTO categories (nom, description) VALUES
    ('Développement Web',       'Ressources et événements liés au développement web'),
    ('Intelligence Artificielle','IA, machine learning, data science'),
    ('Cybersécurité',           'Sécurité informatique, ethical hacking'),
    ('DevOps',                  'CI/CD, conteneurs, infrastructure'),
    ('Compétitions',            'Hackathons, concours de programmation'),
    ('Annonces',                'Actualités générales du club');

-- ============================================================
-- Utilisateurs de démonstration
-- ============================================================

-- 1. Membre
INSERT INTO utilisateurs (dtype, nom, prenom, email, mot_de_passe, statut,
    consentement_rgpd, numero_membre, biographie, date_adhesion, filiere, annee_etude)
VALUES ('Membre', 'Dupont', 'Marie', 'membre@clubinfo.fr',
    '$2a$12$FIcPNpK0b1n4L5P4k2B9MuumQV7sxC4ULBI8zLt5fk3n/pJIHBRSi',
    'ACTIF', TRUE,
    'MBR-001', 'Passionnée de développement web et d''IA.', '2025-09-01', 'Informatique', 'L3');

-- 2. Formateur
INSERT INTO utilisateurs (dtype, nom, prenom, email, mot_de_passe, statut,
    consentement_rgpd, specialite, biographie_professionnelle, filiere)
VALUES ('Formateur', 'Martin', 'Paul', 'formateur@clubinfo.fr',
    '$2a$12$FIcPNpK0b1n4L5P4k2B9MuumQV7sxC4ULBI8zLt5fk3n/pJIHBRSi',
    'ACTIF', TRUE,
    'Développement Web Full Stack', '5 ans d''expérience en Angular et Spring Boot.', 'Génie Logiciel');

-- 3. Responsable Club
INSERT INTO utilisateurs (dtype, nom, prenom, email, mot_de_passe, statut,
    consentement_rgpd, fonction, numero_membre, date_adhesion)
VALUES ('ResponsableClub', 'Leblanc', 'Sophie', 'responsable@clubinfo.fr',
    '$2a$12$FIcPNpK0b1n4L5P4k2B9MuumQV7sxC4ULBI8zLt5fk3n/pJIHBRSi',
    'ACTIF', TRUE,
    'Présidente du Bureau', 'MBR-002', '2024-09-01');

-- 4. Administrateur (2FA activé — secret: JBSWY3DPEHPK3PXP code de test: 123456)
INSERT INTO utilisateurs (dtype, nom, prenom, email, mot_de_passe, statut,
    consentement_rgpd, niveau_acces, totp_enabled, totp_secret)
VALUES ('Administrateur', 'Bernard', 'Thomas', 'admin@clubinfo.fr',
    '$2a$12$FIcPNpK0b1n4L5P4k2B9MuumQV7sxC4ULBI8zLt5fk3n/pJIHBRSi',
    'ACTIF', TRUE,
    'ADMIN', TRUE, 'JBSWY3DPEHPK3PXP');

-- 5. SuperAdmin (2FA activé)
INSERT INTO utilisateurs (dtype, nom, prenom, email, mot_de_passe, statut,
    consentement_rgpd, niveau_acces, totp_enabled, totp_secret)
VALUES ('SuperAdmin', 'Rousseau', 'Alice', 'superadmin@clubinfo.fr',
    '$2a$12$FIcPNpK0b1n4L5P4k2B9MuumQV7sxC4ULBI8zLt5fk3n/pJIHBRSi',
    'ACTIF', TRUE,
    'SUPERADMIN', TRUE, 'JBSWY3DPEHPK3PXP');

-- 6. DSI (2FA activé)
INSERT INTO utilisateurs (dtype, nom, prenom, email, mot_de_passe, statut,
    consentement_rgpd, niveau_acces, totp_enabled, totp_secret)
VALUES ('DSI', 'Moreau', 'Julien', 'dsi@clubinfo.fr',
    '$2a$12$FIcPNpK0b1n4L5P4k2B9MuumQV7sxC4ULBI8zLt5fk3n/pJIHBRSi',
    'ACTIF', TRUE,
    'DSI', TRUE, 'JBSWY3DPEHPK3PXP');

-- 7. Autre membre (bureau)
INSERT INTO utilisateurs (dtype, nom, prenom, email, mot_de_passe, statut,
    consentement_rgpd, numero_membre, biographie, date_adhesion, filiere, annee_etude)
VALUES ('Membre', 'Garcia', 'Lucas', 'lucas.garcia@clubinfo.fr',
    '$2a$12$FIcPNpK0b1n4L5P4k2B9MuumQV7sxC4ULBI8zLt5fk3n/pJIHBRSi',
    'ACTIF', TRUE,
    'MBR-003', 'Vice-président et responsable projets.', '2024-09-15', 'Réseaux', 'M1');

-- ============================================================
-- Attribution des rôles
-- ============================================================
INSERT INTO utilisateurs_roles (utilisateur_id, role_id)
SELECT u.id, r.id FROM utilisateurs u, roles r
WHERE u.email = 'membre@clubinfo.fr' AND r.nom = 'MEMBRE';

INSERT INTO utilisateurs_roles (utilisateur_id, role_id)
SELECT u.id, r.id FROM utilisateurs u, roles r
WHERE u.email = 'formateur@clubinfo.fr' AND r.nom = 'FORMATEUR';

INSERT INTO utilisateurs_roles (utilisateur_id, role_id)
SELECT u.id, r.id FROM utilisateurs u, roles r
WHERE u.email = 'responsable@clubinfo.fr' AND r.nom = 'RESPONSABLE_CLUB';

INSERT INTO utilisateurs_roles (utilisateur_id, role_id)
SELECT u.id, r.id FROM utilisateurs u, roles r
WHERE u.email = 'admin@clubinfo.fr' AND r.nom = 'ADMINISTRATEUR';

INSERT INTO utilisateurs_roles (utilisateur_id, role_id)
SELECT u.id, r.id FROM utilisateurs u, roles r
WHERE u.email = 'superadmin@clubinfo.fr' AND r.nom = 'SUPERADMIN';

INSERT INTO utilisateurs_roles (utilisateur_id, role_id)
SELECT u.id, r.id FROM utilisateurs u, roles r
WHERE u.email = 'dsi@clubinfo.fr' AND r.nom = 'DSI';

INSERT INTO utilisateurs_roles (utilisateur_id, role_id)
SELECT u.id, r.id FROM utilisateurs u, roles r
WHERE u.email = 'lucas.garcia@clubinfo.fr' AND r.nom = 'MEMBRE';

-- ============================================================
-- Actualités
-- ============================================================
INSERT INTO actualites (titre, contenu, date_creation, date_publication, statut, auteur_id, categorie_id)
SELECT
    'Lancement officiel du Club Informatique !',
    '<p>Nous sommes ravis d''annoncer le lancement officiel du <strong>Club Informatique</strong> de notre établissement. Le club a pour vocation de rassembler tous les passionnés d''informatique, de favoriser les échanges et d''organiser des formations et hackathons tout au long de l''année.</p><p>Rejoignez-nous dès maintenant en créant votre compte !</p>',
    NOW(), NOW(), 'PUBLIE',
    u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'responsable@clubinfo.fr' AND c.nom = 'Annonces';

INSERT INTO actualites (titre, contenu, date_creation, date_publication, statut, auteur_id, categorie_id)
SELECT
    'Atelier Angular — Inscription ouverte',
    '<p>Un atelier de <strong>2 jours</strong> sur Angular 18 est organisé par Paul Martin. Cet atelier couvre les bases d''Angular, les composants standalone, le routing et l''intégration avec une API REST.</p><p><strong>Prérequis :</strong> Connaissance de base en JavaScript/TypeScript.</p>',
    NOW(), NOW(), 'PUBLIE',
    u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'responsable@clubinfo.fr' AND c.nom = 'Développement Web';

INSERT INTO actualites (titre, contenu, date_creation, date_publication, statut, auteur_id, categorie_id)
SELECT
    'Hackathon Cybersécurité — Save the Date',
    '<p>Le Club Informatique organise son premier <strong>Hackathon Cybersécurité</strong> le mois prochain. 24 heures pour résoudre des défis de sécurité en équipe de 3 à 5 personnes.</p><p>Les inscriptions ouvriront prochainement.</p>',
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'PUBLIE',
    u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'responsable@clubinfo.fr' AND c.nom = 'Cybersécurité';

-- ============================================================
-- Événements
-- ============================================================
INSERT INTO evenements (titre, description, date_debut, date_fin, lieu, capacite_max, statut, organisateur_id, categorie_id)
SELECT
    'Soirée d''intégration du Club Informatique',
    'Venez faire connaissance avec les membres du club autour d''une présentation des activités de l''année. Buffet et démonstrations de projets au programme.',
    NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days' + INTERVAL '3 hours',
    'Amphi A — Bâtiment Info', 80, 'PLANIFIE',
    u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'responsable@clubinfo.fr' AND c.nom = 'Annonces';

INSERT INTO evenements (titre, description, date_debut, date_fin, lieu, capacite_max, statut, organisateur_id, categorie_id)
SELECT
    'Hackathon Cybersécurité 24h',
    'Compétition de sécurité informatique en équipes. Résolvez des challenges CTF (Capture The Flag) et remportez des prix. Catégories : Web, Crypto, Forensics, Réseau.',
    NOW() + INTERVAL '30 days', NOW() + INTERVAL '31 days',
    'Salle TP Info — RDC', 50, 'PLANIFIE',
    u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'responsable@clubinfo.fr' AND c.nom = 'Cybersécurité';

INSERT INTO evenements (titre, description, date_debut, date_fin, lieu, capacite_max, statut, organisateur_id, categorie_id)
SELECT
    'Conférence : L''IA en entreprise',
    'Un intervenant expert en Intelligence Artificielle vous présentera les cas d''usage réels de l''IA dans les entreprises du CAC40 et les opportunités de carrière dans ce domaine.',
    NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '2 hours',
    'Amphi B — Bâtiment Sciences', 120, 'PLANIFIE',
    u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'responsable@clubinfo.fr' AND c.nom = 'Intelligence Artificielle';

-- ============================================================
-- Formations
-- ============================================================
INSERT INTO formations (titre, description, niveau, duree, statut, formateur_id, categorie_id)
SELECT
    'Angular 18 — De zéro à héros',
    'Formation complète sur Angular 18 : composants standalone, formulaires réactifs, routing, services, intégration API REST, et déploiement. Idéal pour les développeurs ayant des bases en JavaScript.',
    'Intermédiaire', 16, 'PUBLIE',
    u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'formateur@clubinfo.fr' AND c.nom = 'Développement Web';

INSERT INTO formations (titre, description, niveau, duree, statut, formateur_id, categorie_id)
SELECT
    'Introduction au Machine Learning avec Python',
    'Découvrez les bases du Machine Learning : régression linéaire, arbres de décision, réseaux de neurones avec scikit-learn et TensorFlow. Travaux pratiques sur des datasets réels.',
    'Débutant', 12, 'PUBLIE',
    u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'formateur@clubinfo.fr' AND c.nom = 'Intelligence Artificielle';

INSERT INTO formations (titre, description, niveau, duree, statut, formateur_id, categorie_id)
SELECT
    'Docker et Kubernetes pour les développeurs',
    'Maîtrisez la conteneurisation avec Docker : images, volumes, réseaux, docker-compose. Introduction à Kubernetes pour l''orchestration à l''échelle.',
    'Avancé', 8, 'PUBLIE',
    u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'formateur@clubinfo.fr' AND c.nom = 'DevOps';

-- ============================================================
-- Sessions de Formation
-- ============================================================
INSERT INTO sessions_formation (formation_id, date_debut, date_fin, lieu, capacite_max, statut)
SELECT f.id,
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '11 days',
    'Salle TP 201', 20, 'PLANIFIEE'
FROM formations f WHERE f.titre = 'Angular 18 — De zéro à héros';

INSERT INTO sessions_formation (formation_id, date_debut, date_fin, lieu, capacite_max, statut)
SELECT f.id,
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '22 days',
    'Salle TP 301', 25, 'PLANIFIEE'
FROM formations f WHERE f.titre = 'Introduction au Machine Learning avec Python';

INSERT INTO sessions_formation (formation_id, date_debut, date_fin, lieu, capacite_max, statut)
SELECT f.id,
    NOW() + INTERVAL '35 days',
    NOW() + INTERVAL '35 days' + INTERVAL '8 hours',
    'Salle TP 102', 15, 'PLANIFIEE'
FROM formations f WHERE f.titre = 'Docker et Kubernetes pour les développeurs';

-- ============================================================
-- Devoirs
-- ============================================================
INSERT INTO devoirs (formation_id, titre, description, date_limite, statut)
SELECT f.id,
    'TP1 — Créer un composant Angular',
    'Créez un composant standalone affichant une liste de membres du club avec filtrage en temps réel. Utilisez les formulaires réactifs pour le champ de recherche. Rendu attendu : projet GitHub.',
    NOW() + INTERVAL '17 days', 'PUBLIE'
FROM formations f WHERE f.titre = 'Angular 18 — De zéro à héros';

INSERT INTO devoirs (formation_id, titre, description, date_limite, statut)
SELECT f.id,
    'TP2 — Régression linéaire sur dataset Boston Housing',
    'Appliquez une régression linéaire sur le dataset Boston Housing. Évaluez votre modèle avec le RMSE et le R². Visualisez les résultats avec Matplotlib. Rendu : Jupyter Notebook.',
    NOW() + INTERVAL '28 days', 'PUBLIE'
FROM formations f WHERE f.titre = 'Introduction au Machine Learning avec Python';

-- ============================================================
-- Ressources
-- ============================================================
INSERT INTO ressources (titre, type, url, visibilite, auteur_id, categorie_id)
SELECT
    'Guide officiel Angular 18',
    'LIEN', 'https://angular.dev',
    'PUBLIC', u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'formateur@clubinfo.fr' AND c.nom = 'Développement Web';

INSERT INTO ressources (titre, type, url, visibilite, auteur_id, categorie_id)
SELECT
    'Cheat Sheet Spring Boot Security + JWT',
    'PDF', '/files/ressources/spring-security-jwt-cheatsheet.pdf',
    'MEMBRE', u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'formateur@clubinfo.fr' AND c.nom = 'Développement Web';

INSERT INTO ressources (titre, type, url, visibilite, auteur_id, categorie_id)
SELECT
    'Introduction à scikit-learn — Cours PDF',
    'PDF', '/files/ressources/intro-sklearn.pdf',
    'MEMBRE', u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'formateur@clubinfo.fr' AND c.nom = 'Intelligence Artificielle';

INSERT INTO ressources (titre, type, url, visibilite, auteur_id, categorie_id)
SELECT
    'Documentation officielle Docker',
    'LIEN', 'https://docs.docker.com',
    'PUBLIC', u.id, c.id
FROM utilisateurs u, categories c
WHERE u.email = 'formateur@clubinfo.fr' AND c.nom = 'DevOps';

-- Ressources liées aux formations
UPDATE ressources SET formation_id = (SELECT id FROM formations WHERE titre = 'Angular 18 — De zéro à héros')
WHERE titre = 'Cheat Sheet Spring Boot Security + JWT';

UPDATE ressources SET formation_id = (SELECT id FROM formations WHERE titre = 'Introduction au Machine Learning avec Python')
WHERE titre = 'Introduction à scikit-learn — Cours PDF';

-- ============================================================
-- Projets
-- ============================================================
INSERT INTO projets (titre, description, date_soumission, statut, lien_depot, soumetteur_id, encadrant_id)
SELECT
    'Application de gestion de bibliothèque',
    'Application web full-stack permettant la gestion d''une bibliothèque universitaire : catalogue de livres, emprunts, retours, réservations en ligne. Stack : Angular + Spring Boot + PostgreSQL.',
    NOW() - INTERVAL '10 days', 'VALIDE',
    'https://github.com/clubinfo/biblio-app',
    u.id, f.id
FROM utilisateurs u, utilisateurs f
WHERE u.email = 'membre@clubinfo.fr' AND f.email = 'formateur@clubinfo.fr';

INSERT INTO projets (titre, description, date_soumission, statut, lien_depot, soumetteur_id, encadrant_id)
SELECT
    'Chatbot FAQ du département',
    'Bot conversationnel répondant aux questions fréquentes des étudiants concernant les cours, les examens et les inscriptions. Utilise un modèle NLP basé sur transformers.',
    NOW() - INTERVAL '5 days', 'EN_COURS',
    'https://github.com/clubinfo/chatbot-faq',
    u.id, f.id
FROM utilisateurs u, utilisateurs f
WHERE u.email = 'lucas.garcia@clubinfo.fr' AND f.email = 'formateur@clubinfo.fr';

INSERT INTO projets (titre, description, date_soumission, statut, lien_depot, soumetteur_id)
SELECT
    'Dashboard de monitoring réseau',
    'Tableau de bord en temps réel pour surveiller l''infrastructure réseau du département : ping, latence, alertes. Stack : Grafana + InfluxDB + scripts Python.',
    NOW(), 'EN_ATTENTE',
    NULL,
    u.id
FROM utilisateurs u
WHERE u.email = 'membre@clubinfo.fr';

-- Membres des projets
INSERT INTO projets_membres (projet_id, utilisateur_id)
SELECT p.id, u.id FROM projets p, utilisateurs u
WHERE p.titre = 'Application de gestion de bibliothèque' AND u.email = 'membre@clubinfo.fr';

INSERT INTO projets_membres (projet_id, utilisateur_id)
SELECT p.id, u.id FROM projets p, utilisateurs u
WHERE p.titre = 'Chatbot FAQ du département' AND u.email = 'lucas.garcia@clubinfo.fr';

-- ============================================================
-- Inscriptions
-- ============================================================
-- Membre inscrit à l'événement soirée d'intégration
INSERT INTO inscriptions (utilisateur_id, evenement_id, statut)
SELECT u.id, e.id, 'ACCEPTE'
FROM utilisateurs u, evenements e
WHERE u.email = 'membre@clubinfo.fr' AND e.titre = 'Soirée d''intégration du Club Informatique';

-- Membre inscrit à la session Angular
INSERT INTO inscriptions (utilisateur_id, session_id, statut)
SELECT u.id, s.id, 'ACCEPTE'
FROM utilisateurs u, sessions_formation s, formations f
WHERE u.email = 'membre@clubinfo.fr'
  AND s.formation_id = f.id
  AND f.titre = 'Angular 18 — De zéro à héros';

-- Lucas inscrit à l'événement Hackathon
INSERT INTO inscriptions (utilisateur_id, evenement_id, statut)
SELECT u.id, e.id, 'ACCEPTE'
FROM utilisateurs u, evenements e
WHERE u.email = 'lucas.garcia@clubinfo.fr' AND e.titre = 'Hackathon Cybersécurité 24h';

-- ============================================================
-- Notifications
-- ============================================================
INSERT INTO notifications (destinataire_id, titre, message, type)
SELECT u.id,
    'Bienvenue au Club Informatique !',
    'Votre compte a été créé avec succès. Explorez nos formations, événements et projets. N''hésitez pas à vous inscrire !',
    'SUCCES'
FROM utilisateurs u WHERE u.email = 'membre@clubinfo.fr';

INSERT INTO notifications (destinataire_id, titre, message, type)
SELECT u.id,
    'Inscription confirmée — Soirée d''intégration',
    'Votre inscription à l''événement "Soirée d''intégration du Club Informatique" a été confirmée. À bientôt !',
    'SUCCES'
FROM utilisateurs u WHERE u.email = 'membre@clubinfo.fr';

INSERT INTO notifications (destinataire_id, titre, message, type)
SELECT u.id,
    'Rappel — Atelier Angular dans 3 jours',
    'N''oubliez pas que l''atelier Angular démarre dans 3 jours. Pensez à installer Node.js et Angular CLI avant la séance.',
    'INFO'
FROM utilisateurs u WHERE u.email = 'membre@clubinfo.fr';

INSERT INTO notifications (destinataire_id, titre, message, type)
SELECT u.id,
    'Bienvenue au Club Informatique !',
    'Votre compte a été créé avec succès. Vous avez accès au tableau de bord formateur.',
    'SUCCES'
FROM utilisateurs u WHERE u.email = 'formateur@clubinfo.fr';

-- ============================================================
-- Messages de contact
-- ============================================================
INSERT INTO messages_contact (nom, email, sujet, message, traite) VALUES
    ('Jean Visiteur', 'jean.visiteur@example.com', 'Adhésion au club',
     'Bonjour, je suis étudiant en L2 informatique et je souhaite rejoindre le club. Comment faire ? Merci.',
     FALSE),
    ('Emma Externe', 'emma.ext@example.com', 'Partenariat entreprise',
     'Nous sommes une startup et souhaitons proposer des stages aux membres de votre club. Comment vous contacter officiellement ?',
     FALSE),
    ('Prof. Leclerc', 'prof.leclerc@univ.fr', 'Collaboration formation',
     'Bonjour, je suis enseignant en Master Data Science et je souhaite proposer une conférence dans le cadre de vos activités.',
     TRUE);
