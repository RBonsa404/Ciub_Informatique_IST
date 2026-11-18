-- ===================================================================
-- V16 : nom de l'établissement et rôles du président
-- ===================================================================
-- 1. Le nom officiel est « Institut Supérieur de Technologies » : correction des textes déjà enregistrés.
-- 2. Le compte du président réunit tous les rôles (membre, formateur, bureau, DSI, administrateur, Super Admin).

UPDATE page_info
SET contenu = regexp_replace(contenu, 'Institut Supérieur de Technologie(?!s)', 'Institut Supérieur de Technologies', 'g')
WHERE contenu ~ 'Institut Supérieur de Technologie(?!s)';

INSERT INTO utilisateur_role (utilisateur_id, role_id)
SELECT u.id, r.id
FROM utilisateur u
JOIN role r ON r.nom IN ('ROLE_MEMBRE', 'ROLE_FORMATEUR', 'ROLE_RESPONSABLE_CLUB', 'ROLE_DSI', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN')
WHERE u.email = 'president@informatique.ist-club.bf' AND u.deleted_at IS NULL
ON CONFLICT DO NOTHING;
