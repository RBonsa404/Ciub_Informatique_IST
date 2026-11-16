-- ===================================================================
-- V14 : textes de l'accueil et de la présentation pour le lancement public
-- ===================================================================
-- Réécriture des deux pages d'information. Seules les pages jamais modifiées depuis l'administration
-- (updated_at vide) sont remplacées : un texte rédigé par le club n'est jamais écrasé.
-- Les textes ne citent ni date, ni effectif, ni partenaire.

UPDATE page_info SET contenu =
'Le Club Informatique de l’IST réunit, à Ouagadougou, les étudiants de l’Institut Supérieur de Technologie qui veulent aller plus loin que les cours. Formations pratiques, ateliers, projets en équipe et événements : ici, on apprend en construisant, quel que soit son niveau de départ.'
WHERE slug = 'accueil' AND updated_at IS NULL;

UPDATE page_info SET contenu =
'Le Club Informatique de l’IST est le club des étudiants de l’Institut Supérieur de Technologie, à Ouagadougou, au Burkina Faso, qui ont envie de pratiquer l’informatique. Débutant curieux ou passionné confirmé, chacun y trouve sa place.

Les cours donnent les bases. Le club permet d’aller plus loin : essayer, se tromper, recommencer, et profiter de ce que les autres ont déjà appris. Notre conviction est simple : on progresse plus vite ensemble, en mettant les mains dans le code et dans les machines.

# Notre mission

Faire de chaque membre un praticien : quelqu’un qui sait apprendre seul, travailler en équipe et mener un projet jusqu’au bout. Le club veut aussi rapprocher les étudiants du monde professionnel du numérique et faire rayonner l’IST au-delà de ses murs.

# Ce que nous faisons

Des formations courtes et concrètes, animées par des membres du club ou des intervenants : développement web et mobile, réseaux, cybersécurité, données et intelligence artificielle. Des ateliers pratiques, des projets réels menés en équipe et des événements ouverts aux étudiants. Les supports restent consultables à tout moment dans l’espace Ressources.

# Comment cela fonctionne

Chaque membre peut suivre les formations, proposer un projet, en rejoindre un ou partager ce qu’il sait. Le bureau organise les activités, examine les propositions de projets et veille au bon fonctionnement du club. La plateforme centralise tout : inscriptions, présences, projets et ressources.

# Nous rejoindre

L’inscription est gratuite et se fait en quelques minutes sur ce site, avec une adresse électronique. Une fois votre compte activé, vous accédez aux formations, aux événements et aux projets. Une question ? Écrivez-nous depuis la page Contact : nous vous répondrons avec plaisir.'
WHERE slug = 'presentation' AND updated_at IS NULL;
