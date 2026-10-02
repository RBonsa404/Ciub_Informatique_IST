-- ===================================================================
-- V6 : contenus publics
-- ===================================================================

-- 1. Pages créées par V2 : leur texte décrivait un club imaginaire. Elles sont retirées tant que personne ne les a
--    modifiées ; le club rédige les siennes. La page « bureau » est remplacée par la table du bureau.
DELETE FROM page_info WHERE slug = 'bureau';
DELETE FROM page_info WHERE slug IN ('accueil', 'presentation') AND updated_at IS NULL AND modifie_par_id IS NULL;

-- 2. Catégories créées d'office par V2 : retirées si rien ne les utilise et si personne ne les a modifiées.
--    Celles qui servent déjà sont conservées, avec un libellé correctement accentué.
DELETE FROM categorie c
WHERE c.id BETWEEN 1 AND 5
  AND c.updated_at IS NULL
  AND c.created_by IS NULL
  AND NOT EXISTS (SELECT 1 FROM actualite a WHERE a.categorie_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM evenement e WHERE e.categorie_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM formation f WHERE f.categorie_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM projet p WHERE p.categorie_id = c.id)
  AND NOT EXISTS (SELECT 1 FROM ressource r WHERE r.categorie_id = c.id);

UPDATE categorie SET nom = 'Développement web et mobile',
    description = 'Conception d''applications web et mobiles, interfaces, services et architectures distribuées'
WHERE id = 1 AND nom = 'Developpement Web & Mobile';
UPDATE categorie SET description = 'Apprentissage automatique, traitement de données et vision par ordinateur'
WHERE id = 2 AND description LIKE 'Machine Learning%';
UPDATE categorie SET nom = 'Cybersécurité et réseaux',
    description = 'Sécurité offensive et défensive, protocoles et administration des infrastructures'
WHERE id = 3 AND nom = 'Cybersecurite & Reseaux';
UPDATE categorie SET nom = 'Cloud, DevOps et systèmes',
    description = 'Intégration et déploiement continus, conteneurs, orchestration et services d''hébergement'
WHERE id = 4 AND nom = 'Cloud, DevOps & Systemes';
UPDATE categorie SET nom = 'Ateliers et hackathons',
    description = 'Événements immersifs, défis de programmation et projets collectifs'
WHERE id = 5 AND nom = 'Ateliers & Hackathons';

-- 3. Libellés de référence correctement accentués (ils s'affichent dans la matrice des permissions).
UPDATE role SET description = 'Membre actif du club informatique' WHERE nom = 'ROLE_MEMBRE';
UPDATE role SET description = 'Formateur et animateur d''ateliers techniques' WHERE nom = 'ROLE_FORMATEUR';
UPDATE role SET description = 'Membre du bureau exécutif et responsable d''activités' WHERE nom = 'ROLE_RESPONSABLE_CLUB';
UPDATE role SET description = 'Administrateur de la plateforme' WHERE nom = 'ROLE_ADMIN';
UPDATE role SET description = 'Super administrateur, avec accès complet aux réglages du système' WHERE nom = 'ROLE_SUPER_ADMIN';
UPDATE role SET description = 'Représentant de la DSI, pour la conformité technique et l''audit' WHERE nom = 'ROLE_DSI';

UPDATE permission SET libelle = 'Consulter les formations' WHERE code = 'FORMATION_READ';
UPDATE permission SET libelle = 'Créer une formation' WHERE code = 'FORMATION_CREATE';
UPDATE permission SET libelle = 'Modifier une formation' WHERE code = 'FORMATION_UPDATE';
UPDATE permission SET libelle = 'Supprimer une formation' WHERE code = 'FORMATION_DELETE';
UPDATE permission SET libelle = 'Consulter les événements' WHERE code = 'EVENEMENT_READ';
UPDATE permission SET libelle = 'Créer un événement' WHERE code = 'EVENEMENT_CREATE';
UPDATE permission SET libelle = 'Modifier un événement' WHERE code = 'EVENEMENT_UPDATE';
UPDATE permission SET libelle = 'Supprimer un événement' WHERE code = 'EVENEMENT_DELETE';
UPDATE permission SET libelle = 'Consulter les actualités' WHERE code = 'ACTUALITE_READ';
UPDATE permission SET libelle = 'Publier une actualité' WHERE code = 'ACTUALITE_CREATE';
UPDATE permission SET libelle = 'Modifier une actualité' WHERE code = 'ACTUALITE_UPDATE';
UPDATE permission SET libelle = 'Supprimer une actualité' WHERE code = 'ACTUALITE_DELETE';
UPDATE permission SET libelle = 'Consulter les projets' WHERE code = 'PROJET_READ';
UPDATE permission SET libelle = 'Proposer un projet étudiant' WHERE code = 'PROJET_PROPOSE';
UPDATE permission SET libelle = 'Valider ou rejeter un projet' WHERE code = 'PROJET_VALIDATE';
UPDATE permission SET libelle = 'Suivre et encadrer un projet' WHERE code = 'PROJET_COACH';
UPDATE permission SET libelle = 'Consulter et télécharger des ressources' WHERE code = 'RESSOURCE_READ';
UPDATE permission SET libelle = 'Ajouter une ressource pédagogique' WHERE code = 'RESSOURCE_CREATE';
UPDATE permission SET libelle = 'Supprimer une ressource pédagogique' WHERE code = 'RESSOURCE_DELETE';
UPDATE permission SET libelle = 'S''inscrire à une activité' WHERE code = 'INSCRIPTION_CREATE';
UPDATE permission SET libelle = 'Annuler une inscription' WHERE code = 'INSCRIPTION_CANCEL';
UPDATE permission SET libelle = 'Gérer la liste des inscrits et les promotions' WHERE code = 'INSCRIPTION_MANAGE';
UPDATE permission SET libelle = 'Émarger et gérer les feuilles de présence' WHERE code = 'PRESENCE_MANAGE';
UPDATE permission SET libelle = 'Consulter l''annuaire des utilisateurs' WHERE code = 'USER_READ';
UPDATE permission SET libelle = 'Gérer les comptes utilisateurs' WHERE code = 'USER_MANAGE';
UPDATE permission SET libelle = 'Attribuer et configurer les rôles' WHERE code = 'ROLE_MANAGE';
UPDATE permission SET libelle = 'Consulter les statistiques globales' WHERE code = 'STATS_READ';
UPDATE permission SET libelle = 'Superviser les alertes et les journaux de sécurité' WHERE code = 'SECURITY_SUPERVISE';
UPDATE permission SET libelle = 'Gérer les paramètres et la maintenance du système' WHERE code = 'SYSTEM_CONFIG';
UPDATE permission SET libelle = 'Audit et conformité technique en lecture seule' WHERE code = 'DSI_AUDIT';

-- 4. Bureau du club : composition réelle saisie par le Responsable. Aucune photo.
CREATE TABLE membre_bureau (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    fonction VARCHAR(100) NOT NULL,
    filiere VARCHAR(100),
    ordre INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_membre_bureau_ordre ON membre_bureau(ordre);

-- 5. Actualités : une actualité est publique ou réservée aux membres.
ALTER TABLE actualite ADD COLUMN visibilite VARCHAR(20) NOT NULL DEFAULT 'PUBLIC' CHECK (visibilite IN ('PUBLIC', 'MEMBRES'));
CREATE INDEX idx_actualite_visibilite ON actualite(visibilite);

-- 6. Le nom d'une catégorie supprimée doit pouvoir être repris.
DELETE FROM categorie WHERE deleted_at IS NOT NULL;
