-- ===================================================================
-- V13 : composition du bureau du club
-- ===================================================================
-- Composition officielle du bureau communiquée par le club. Elle remplace les membres saisis auparavant ;
-- le Responsable peut ensuite la modifier depuis l'écran de gestion du bureau.

DELETE FROM membre_bureau;

INSERT INTO membre_bureau (nom, prenom, fonction, filiere, ordre, created_by) VALUES
('BONSA', 'Abdoul Rachid', 'Président', 'Réseaux et Systèmes Informatiques, 3e année', 1, 'migration'),
('PAMOUSSO', 'Prince Henri Junior', 'Vice-président', 'Réseaux et Systèmes Informatiques, 3e année', 2, 'migration'),
('SIDIBE', 'Ramatou', 'Responsable des relations extérieures', 'Réseaux et Systèmes Informatiques, 3e année', 3, 'migration'),
('OUARE', 'Davy Arnaud', 'Responsable communication', 'Réseaux et Systèmes Informatiques, 3e année', 4, 'migration'),
('SALOU', 'Giles Christ-Orient', 'Responsable formation', 'Réseaux et Systèmes Informatiques, 3e année', 5, 'migration'),
('ZONGO', 'Tony Darel', 'Responsable projets', 'Réseaux et Systèmes Informatiques, 3e année', 6, 'migration'),
('KI', 'Fode Sandrine', 'Responsable trésorerie', 'Réseaux et Systèmes Informatiques, 3e année', 7, 'migration'),
('OUEDRAOGO', 'Hannifah', 'Secrétaire générale', 'Réseaux et Systèmes Informatiques, 3e année', 8, 'migration');
