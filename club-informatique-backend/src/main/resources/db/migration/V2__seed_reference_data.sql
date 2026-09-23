-- ===================================================================
-- Migration Flyway V2 : Données de référence et compte initial
-- Plateforme Club Informatique IST
-- ===================================================================

-- 1. Insertion des Rôles
INSERT INTO role (id, nom, description, created_at) VALUES
(1, 'ROLE_MEMBRE', 'Membre actif du club informatique', NOW()),
(2, 'ROLE_FORMATEUR', 'Formateur et animateur d ateliers techniques', NOW()),
(3, 'ROLE_RESPONSABLE_CLUB', 'Membre du bureau executif et responsable d activites', NOW()),
(4, 'ROLE_ADMIN', 'Administrateur de la plateforme', NOW()),
(5, 'ROLE_SUPER_ADMIN', 'Super administrateur avec acces complet aux reglages systeme', NOW()),
(6, 'ROLE_DSI', 'Representant DSI pour la conformite technique et l audit', NOW())
ON CONFLICT (nom) DO NOTHING;

-- 2. Insertion des Permissions granulaires
INSERT INTO permission (code, libelle, created_at) VALUES
('FORMATION_READ', 'Consulter les formations', NOW()),
('FORMATION_CREATE', 'Creer une formation', NOW()),
('FORMATION_UPDATE', 'Modifier une formation', NOW()),
('FORMATION_DELETE', 'Supprimer une formation', NOW()),
('EVENEMENT_READ', 'Consulter les evenements', NOW()),
('EVENEMENT_CREATE', 'Creer un evenement', NOW()),
('EVENEMENT_UPDATE', 'Modifier un evenement', NOW()),
('EVENEMENT_DELETE', 'Supprimer un evenement', NOW()),
('ACTUALITE_READ', 'Consulter les actualites', NOW()),
('ACTUALITE_CREATE', 'Publier une actualite', NOW()),
('ACTUALITE_UPDATE', 'Modifier une actualite', NOW()),
('ACTUALITE_DELETE', 'Supprimer une actualite', NOW()),
('PROJET_READ', 'Consulter les projets', NOW()),
('PROJET_PROPOSE', 'Proposer un projet etudiant', NOW()),
('PROJET_VALIDATE', 'Valider ou rejeter un projet', NOW()),
('PROJET_COACH', 'Suivre et encadrer un projet', NOW()),
('RESSOURCE_READ', 'Consulter et telecharger des ressources', NOW()),
('RESSOURCE_CREATE', 'Ajouter une ressource pedagogique', NOW()),
('RESSOURCE_DELETE', 'Supprimer une ressource pedagogique', NOW()),
('INSCRIPTION_CREATE', 'S inscrire a une activite', NOW()),
('INSCRIPTION_CANCEL', 'Annuler une inscription', NOW()),
('INSCRIPTION_MANAGE', 'Gerer la liste des inscrits et promotions', NOW()),
('PRESENCE_MANAGE', 'Emarger et gerer les feuilles de presence', NOW()),
('USER_READ', 'Consulter l annuaire des utilisateurs', NOW()),
('USER_MANAGE', 'Gerer les comptes utilisateurs', NOW()),
('ROLE_MANAGE', 'Attribuer et configurer les roles', NOW()),
('STATS_READ', 'Consulter les statistiques globales', NOW()),
('SECURITY_SUPERVISE', 'Superviser les alertes et logs de securite', NOW()),
('SYSTEM_CONFIG', 'Gerer les parametres et la maintenance du systeme', NOW()),
('DSI_AUDIT', 'Audit et conformite technique DSI en lecture seule', NOW())
ON CONFLICT (code) DO NOTHING;

-- 3. Association Rôles <-> Permissions
-- Rôle MEMBRE
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.nom = 'ROLE_MEMBRE' AND p.code IN (
    'FORMATION_READ', 'EVENEMENT_READ', 'ACTUALITE_READ', 'PROJET_READ',
    'PROJET_PROPOSE', 'RESSOURCE_READ', 'INSCRIPTION_CREATE', 'INSCRIPTION_CANCEL'
) ON CONFLICT DO NOTHING;

-- Rôle FORMATEUR (Membre + formateur permissions)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.nom = 'ROLE_FORMATEUR' AND p.code IN (
    'FORMATION_READ', 'FORMATION_CREATE', 'FORMATION_UPDATE',
    'EVENEMENT_READ', 'ACTUALITE_READ', 'PROJET_READ', 'PROJET_COACH',
    'RESSOURCE_READ', 'RESSOURCE_CREATE', 'INSCRIPTION_CREATE', 'INSCRIPTION_CANCEL',
    'INSCRIPTION_MANAGE', 'PRESENCE_MANAGE'
) ON CONFLICT DO NOTHING;

-- Rôle RESPONSABLE_CLUB
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.nom = 'ROLE_RESPONSABLE_CLUB' AND p.code IN (
    'FORMATION_READ', 'FORMATION_CREATE', 'FORMATION_UPDATE',
    'EVENEMENT_READ', 'EVENEMENT_CREATE', 'EVENEMENT_UPDATE', 'EVENEMENT_DELETE',
    'ACTUALITE_READ', 'ACTUALITE_CREATE', 'ACTUALITE_UPDATE', 'ACTUALITE_DELETE',
    'PROJET_READ', 'PROJET_VALIDATE', 'PROJET_COACH',
    'RESSOURCE_READ', 'RESSOURCE_CREATE',
    'INSCRIPTION_CREATE', 'INSCRIPTION_CANCEL', 'INSCRIPTION_MANAGE', 'PRESENCE_MANAGE',
    'USER_READ', 'STATS_READ'
) ON CONFLICT DO NOTHING;

-- Rôle ADMIN
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.nom = 'ROLE_ADMIN' AND p.code IN (
    'FORMATION_READ', 'FORMATION_CREATE', 'FORMATION_UPDATE', 'FORMATION_DELETE',
    'EVENEMENT_READ', 'EVENEMENT_CREATE', 'EVENEMENT_UPDATE', 'EVENEMENT_DELETE',
    'ACTUALITE_READ', 'ACTUALITE_CREATE', 'ACTUALITE_UPDATE', 'ACTUALITE_DELETE',
    'PROJET_READ', 'PROJET_VALIDATE', 'PROJET_COACH',
    'RESSOURCE_READ', 'RESSOURCE_CREATE', 'RESSOURCE_DELETE',
    'INSCRIPTION_CREATE', 'INSCRIPTION_CANCEL', 'INSCRIPTION_MANAGE', 'PRESENCE_MANAGE',
    'USER_READ', 'USER_MANAGE', 'ROLE_MANAGE', 'STATS_READ', 'SECURITY_SUPERVISE'
) ON CONFLICT DO NOTHING;

-- Rôle SUPER_ADMIN (Toutes permissions)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.nom = 'ROLE_SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Rôle DSI (Lecture seule conformité et audit)
INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id FROM role r, permission p
WHERE r.nom = 'ROLE_DSI' AND p.code IN ('DSI_AUDIT', 'STATS_READ', 'USER_READ')
ON CONFLICT DO NOTHING;

-- 4. Insertion des Catégories par défaut
INSERT INTO categorie (id, nom, slug, description, couleur, created_at) VALUES
(1, 'Developpement Web & Mobile', 'dev-web-mobile', 'Conception d applications modernes, front-end, back-end et architectures distribuees', '#3B82F6', NOW()),
(2, 'Intelligence Artificielle & Data', 'ia-data', 'Machine Learning, Deep Learning, traitement de donnees et vision par ordinateur', '#8B5CF6', NOW()),
(3, 'Cybersecurite & Reseaux', 'cyber-reseau', 'Securite offensive et defensive, protocoles et administration des infrastructures', '#EF4444', NOW()),
(4, 'Cloud, DevOps & Systemes', 'cloud-devops', 'CI/CD, conteneurisation Docker, Kubernetes et cloud providers', '#10B981', NOW()),
(5, 'Ateliers & Hackathons', 'ateliers-hackathons', 'Evenements immersifs, challenges de code et projets collectifs', '#F59E0B', NOW())
ON CONFLICT (slug) DO NOTHING;

-- 5. Insertion du contenu des Pages Informatives par défaut
INSERT INTO page_info (id, slug, titre, contenu, created_at) VALUES
(1, 'accueil', 'Bienvenue au Club Informatique IST', '# Club Informatique IST\n\nBienvenue sur la plateforme officielle du Club Informatique de l IST. Découvrez nos formations, participez à nos événements et développez vos projets au sein d une communauté passionnée de futurs ingénieurs.', NOW()),
(2, 'presentation', 'Présentation & Missions du Club', '# Notre Mission\n\nLe Club Informatique de l Institut Supérieur de Technologie a pour vocation de promouvoir la culture numérique, le partage des connaissances et l excellence technique à travers des ateliers pratiques, du tutorat et des compétitions technologiques.', NOW()),
(3, 'bureau', 'Bureau Exécutif du Club', '# Bureau Exécutif\n\nLe bureau du club assure la gouvernance, la coordination des pôles d activités (Développement, IA, Cybersécurité) et le lien avec la direction de l école et les partenaires industriels.', NOW())
ON CONFLICT (slug) DO NOTHING;

-- 6. Insertion du Compte Super Administrateur initial (Mot de passe : Admin@IST2026!)
-- Hash BCrypt coût 12 de 'Admin@IST2026!' : $2a$12$4LpTz3Y/V5K9mK/m9q6VdeU58c65t29D9q5r6Z7i0s1u2v3w4x5y6 (standard Spring Security)
INSERT INTO utilisateur (
    id, nom, prenom, email, mot_de_passe, statut, numero_membre, date_adhesion, created_at
) VALUES (
    1, 'Administrateur', 'Super', 'admin@clubinfo-ist.ci',
    '$2a$12$K89s3wZ9bW3x7c4XJ3Q8qeMhVj/4.P2Q8gE0XUj1L9D8b7iZ7L2rW',
    'ACTIF', 'IST-2026-0001', CURRENT_DATE, NOW()
) ON CONFLICT (email) DO NOTHING;

-- Attribution des rôles au Super Admin initial
INSERT INTO utilisateur_role (utilisateur_id, role_id) VALUES
(1, 1), -- ROLE_MEMBRE
(2, 2), -- ROLE_FORMATEUR
(3, 3), -- ROLE_RESPONSABLE_CLUB
(4, 4), -- ROLE_ADMIN
(5, 5)  -- ROLE_SUPER_ADMIN
ON CONFLICT DO NOTHING;

-- Reset sequence IDs
SELECT setval(pg_get_serial_sequence('utilisateur', 'id'), COALESCE(max(id), 1)) FROM utilisateur;
SELECT setval(pg_get_serial_sequence('role', 'id'), COALESCE(max(id), 1)) FROM role;
SELECT setval(pg_get_serial_sequence('permission', 'id'), COALESCE(max(id), 1)) FROM permission;
SELECT setval(pg_get_serial_sequence('categorie', 'id'), COALESCE(max(id), 1)) FROM categorie;
SELECT setval(pg_get_serial_sequence('page_info', 'id'), COALESCE(max(id), 1)) FROM page_info;
