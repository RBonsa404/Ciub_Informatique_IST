-- ===================================================================
-- V12 : liens des notifications
-- ===================================================================
-- Deux notifications menaient à une adresse qui n'existe pas dans le site (page introuvable au clic sur « Ouvrir ») :
-- la décision sur un projet et la publication d'un devoir. Les notifications déjà enregistrées sont corrigées.

UPDATE notification SET lien = '/espace/projets' WHERE lien = '/espace/membre/projets';
UPDATE notification SET lien = '/espace/supports' WHERE lien = '/espace/membre/supports';
