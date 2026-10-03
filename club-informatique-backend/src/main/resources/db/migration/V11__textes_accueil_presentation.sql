-- ===================================================================
-- V11 : textes de l'accueil et de la présentation
-- ===================================================================
-- Première version des deux pages d'information. Elles restent modifiables depuis l'administration ;
-- une page déjà rédigée par le club n'est pas touchée. Les textes ne citent ni date, ni effectif, ni partenaire.

INSERT INTO page_info (slug, titre, contenu, created_at) VALUES
('accueil', 'Accueil',
 'Le club rassemble les étudiants de l’Institut Supérieur de Technologie qui veulent pratiquer l’informatique au-delà des cours. Vous pouvez y suivre des formations, travailler sur des projets en équipe et participer aux événements du club, quel que soit votre niveau de départ.',
 NOW()),
('presentation', 'Qui sommes-nous',
 'Le Club Informatique de l’IST est un club d’étudiants installé à Ouagadougou. Il s’adresse à celles et ceux qui ont envie d’apprendre en faisant, et de ne pas rester seuls face à un problème technique.

Les cours donnent les bases. Le club permet d’aller plus loin : essayer, se tromper, recommencer, et profiter de ce que les autres ont déjà appris.

# Ce que nous faisons

Des formations courtes animées par des membres ou des intervenants, des ateliers pratiques et des événements ouverts aux étudiants. Les supports restent consultables dans l’espace ressources.

# Comment cela fonctionne

Chaque membre peut proposer un projet, en rejoindre un ou partager ce qu’il sait. Le bureau organise les activités, examine les propositions de projets et veille au bon fonctionnement du club.

# Nous rejoindre

L’inscription se fait sur ce site, avec une adresse électronique. Une fois votre compte activé, vous accédez aux formations, aux événements et aux projets. Pour toute question, écrivez-nous depuis la page Contact.',
 NOW())
ON CONFLICT (slug) DO NOTHING;
