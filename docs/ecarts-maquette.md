# Écarts entre la maquette et le produit

Ce registre consigne toute différence entre la maquette HTML et le produit. Classement : « assumé » (écart voulu et justifié), « correction » (défaut de la maquette corrigé), « retrait » (élément supprimé faute de donnée réelle ou hors périmètre), « dérivation » (élément absent de la maquette, déduit de ses composants), « à décider » (attend l'utilisateur). Mise à jour à chaque page livrée.

## 1. Écarts transversaux constatés en Phase 0

| ID | Constat dans la maquette | Preuve | Traitement | Classement |
|---|---|---|---|---|
| E-01 | Icônes mixtes : pictogrammes SVG au trait (grille 24, épaisseur 2, style Feather) et nombreux emoji (bascule de thème, titres de section, dates, lieux, fonctions du bureau, blocs d'éditeur) | 43 pages sur 67 contiennent au moins un emoji dans leur contenu principal ; la bascule de thème de l'en-tête en utilise un sur toutes les pages | Les SVG au trait de la maquette font référence ; chaque emoji est remplacé par le pictogramme équivalent de la même famille. Aucun emoji dans le produit. | correction |
| E-02 | Glyphes de marques (WhatsApp, LinkedIn, Facebook, TikTok) dessinés au trait générique | pied de page de toutes les pages publiques | Glyphes officiels simplifiés (Simple Icons), même taille (18 px) et même bouton que la maquette | correction (section 7.6.4) |
| E-03 | Aucune page n'est utilisable sur mobile, contrairement au README : à 390 px, le contenu mesure de 949 à 1 015 px de large | `docs/maquette-ref/rapport-capture.json`, `docs/maquette-ref/sombre/390/` | Variantes tablette et mobile dérivées (tiroir de navigation, grilles à une colonne, tableaux en cartes, cibles de 44 px) | dérivation (10.1.4) |
| E-04 | En-tête public trop chargé à 1 440 px : le nom du club passe sur cinq lignes (hauteur 136 px), la navigation chevauche la bascule de thème | `docs/maquette-ref/sombre/1440/01-accueil.png` | Navigation ramenée à sept entrées, bascule de thème réduite à une icône, nom du club sur deux lignes ; hauteur visée : celle prévue par la feuille de style (logo de 44 px, marge verticale de 12,8 px) | correction |
| E-05 | Le libellé « Mode Clair / Mode Sombre » s'affiche à côté de l'icône : la classe `sr-only` employée par `theme.js` n'existe pas dans `main.css` | `assets/js/theme.js`, `assets/css/main.css` | Texte réservé aux lecteurs d'écran, bouton à icône seule avec nom accessible | correction |
| E-06 | Les écrans d'authentification utilisent tantôt l'en-tête public complet (18, 20), tantôt aucun (19, 21) | captures 18 à 21 | Gabarit d'authentification unique (section 7.5) | assumé |
| E-07 | Les styles des modales, des notifications éphémères et des onglets ne s'appliquent qu'en deçà de 768 px : la règle `@media (max-width: 768px)` ouverte à la ligne 910 de `main.css` n'est jamais refermée | `styles-calcules.json` : `.modal-card` sans fond ni largeur maximale à 1 440 px | Les valeurs écrites dans la feuille de style (lignes 943 à 1 104) servent de référence à toutes les largeurs | correction |
| E-08 | Champ de recherche globale dans la barre supérieure des tableaux de bord | écrans 22 et 35 | Non repris tant qu'aucune recherche transversale n'existe côté backend (section 7.5) | retrait |
| E-09 | Polices chargées depuis Google Fonts | `main.css`, ligne 6 | Polices hébergées localement (section 5.5) ; graisses réellement utilisées : Inter 400, 500, 600, 700 ; Poppins 500, 600, 700, 800 ; JetBrains Mono 400 | assumé |
| E-10 | Très nombreux styles en ligne (jusqu'à 99 attributs `style` par page) avec des valeurs hors jetons (dégradé `#0055ff` vers `#0088ff`, rayons de 12 et 20 px, etc.) | relevé `inventaire` | Valeurs reprises à l'identique dans le CSS de composant ; celles qui se répètent sont promues en jetons | assumé |
| E-11 | L'écran 11 est un lecteur de leçons (curriculum, extrait de code, « Leçon 1 sur 7 ») ; l'écran 10 affiche une progression | écrans 10 et 11 | Le CDC ne prévoit ni leçons en ligne ni progression : la page devient une fiche de formation (description, niveau, prérequis, objectifs, sessions, inscription) dans la même composition visuelle | retrait partiel |
| E-12 | Éditeur par blocs glisser-déposer (image, vidéo, citation, galerie, bouton) | écran 44 | Le backend stocke un titre, un résumé, un contenu et une image. Proposition : éditeur de texte structuré avec image de couverture, dans la mise en page de l'écran 44 | à décider (D-02) |
| E-13 | Barre latérale d'administration commune « ADMIN / DSI » | écrans 50 à 57 | Trois espaces distincts : Administrateur, Super Admin (hérite d'Administrateur), DSI (lecture seule, indépendant) | assumé (`use-cases.md`) |
| E-14 | Section d'authentification à deux facteurs absente de la maquette (écran 27 « hors 2FA ») alors que le CDC la rend obligatoire pour les rôles sensibles | CDC, besoins 39 et BNF-02 | Aucune interface 2FA (règle 6.6) ; fondations backend conservées | assumé, conflit CDC signalé |
| E-15 | Photo des membres du bureau prévue par le CDC (besoin 8) | CDC | Avatars neutres à initiales, comme dans la maquette (règle 6.4) | assumé, conflit CDC signalé |
| E-16 | Thème par défaut sombre en l'absence de préférence, sauf préférence système claire | `theme.js` | Préférence système par défaut, bascule mémorisée, application avant le premier rendu | conforme |
| E-17 | Logo affiché dans un conteneur blanc arrondi ; le fichier `logo.png` est entièrement opaque (aucun pixel transparent) sur fond blanc | mesure sur les 1 572 516 pixels | Conteneur blanc conservé dans les deux thèmes, logo non retouché (10.4.1) | conforme |
| E-18 | Formulaire d'inscription : « Nom complet », courriel, filière, téléphone, mot de passe | écran 18 | Le CDC demande nom, prénom, courriel, date de naissance, filière | à décider (D-08) |
| E-19 | Couleur d'accent ambre `#FBBF24` sur fond clair pour de petits textes (sous-titre de marque, rôle) | `tokens.css` | Contraste à mesurer en Phase 1 ; si inférieur à 4,5:1, seul le texte concerné passe à la variante sombre déjà prévue par la maquette (`#B45309` ou `#D97706`) | à vérifier (10.2.3) |

| E-20 | Motif circuit : le SVG de fond utilise `currentColor`, qui vaut noir dans une image d'arrière-plan ; le motif est donc quasi invisible en thème sombre, alors que le jeton prévoit un trait cyan | `main.css` (règle `body::before`), `tokens.css` (`--circuit-stroke`) | Motif teinté par le jeton du thème au moyen d'un masque, opacité du jeton conservée (12 % en sombre, 5 % en clair) | correction, à valider visuellement |
| E-21 | Bouton « danger » : texte blanc sur `#EF4444`, contraste de 3,8:1 | mesure axe | Fond `#DC2626` (survol `#B91C1C`) : contraste de 4,8:1 | correction (10.2.3) |
| E-22 | Contrastes insuffisants de petits textes : liens `#0284C7` et ambre `#D97706` en thème clair, textes des badges de statut sur fond teinté, sous-titre de marque ambre sur fond clair | mesures axe sur `/__design` et les gabarits | Seule la couleur du texte change : liens `#0369A1`, ambre `#B45309`, badges (succès, danger, neutre, ambre) assombris en clair et éclaircis en sombre ; valeurs dans `src/styles/tokens.css` | correction (10.2.3) |
| E-23 | Hauteur de ligne différente entre un lien et un bouton de même classe `.btn` (1,6 pour `<a>`, valeur native pour `<button>`), soit environ 2 px d'écart de hauteur | styles calculés | Interligne unique de 1,6 pour tous les boutons ; champs de saisie conservés à la valeur native (hauteur de 46,6 px) | assumé |
| E-24 | Navigation publique : la maquette passe en menu réduit à 768 px, largeur à laquelle sept entrées, la marque et les actions ne tiennent pas (débordement mesuré jusqu'à 1 279 px) | `rapport.json` de la recette du socle | Tiroir latéral en deçà de 1 280 px ; barre latérale de l'espace en tiroir en deçà de 1 024 px | dérivation |
| E-25 | Classe `.container` de la maquette | — | Renommée `.page-container` (mêmes valeurs) pour éviter l'utilitaire homonyme de Tailwind | assumé, sans effet visuel |
| E-26 | Sélecteur, case à cocher : composants natifs dans la maquette ; aucun interrupteur dessiné | écrans 27, 37 | Sélecteur et case natifs conservés ; interrupteur dérivé des jetons | dérivation (10.1.5) |
| E-27 | Texte atténué du thème clair (`#64748B`) : contraste insuffisant sur les surfaces vitrées et les fonds à halo | mesures axe sur les pages publiques | `#566378` en thème clair ; ambre des petits textes `#92400E`, ambre des grands titres `#B45309` | correction (10.2.3) |
| E-28 | Textes d'accroche et slogans des pages publiques (bandeau d'accueil, devise, citations, promesse de délai de réponse) | écrans 01, 02, 13, 18, 19 | Retirés tant que le club ne les a pas validés ; les phrases d'interface restantes sont factuelles | retrait (C.1) |
| E-29 | Pages légales : trois mises en page différentes dans la maquette (14 et 15), aucune pour les mentions légales | écrans 14, 15 | Mise en page unique de l'écran 14 (sommaire collant, sections numérotées) pour les trois textes | assumé |
| E-30 | Cartes de liste non cliquables dans la maquette ; seul le titre est un lien | écrans 04, 08, 10 | Le lien du titre couvre toute la carte (une seule cible, nom accessible égal au titre) | assumé |
| E-31 | Barre supérieure de l'espace : recherche globale et pastille de notifications à valeur fixe | écrans 22 à 57 | Fil d'Ariane, cloche avec le nombre réel de notifications non lues (absente tant que le nombre est inconnu ou nul), thème, menu du compte ; aucune recherche globale (absente du CDC) | assumé |
| E-32 | Panneau « Activités récentes » du tableau de bord Membre : flux social à contenu fictif | écran 22 | Remplacé par « Dernières notifications », alimenté par les notifications réelles du membre | assumé (D-01) |
| E-33 | Paramètres du compte : progression « 66 % », notifications « push », choix de langue, visibilité des projets | écran 27 | Retirés ; panneau « Mes données » (copie des données personnelles) à la place de « Confidentialité » ; cinq panneaux numérotés | retrait et dérivation (section 1, BNF-09) |
| E-34 | « Télécharger l'attestation », remise de devoir, champs « Difficulté », « Matière », « Niveau », poids de fichier | écrans 28, 29, 30 | Retirés : fonctions et données absentes du CDC et du modèle ; consultation seule (D-03) | retrait |
| E-35 | Téléversement d'avatar, champs GitHub, LinkedIn et compétences | écrans 25, 26 | Retirés ; avatar à initiales (D-04) | retrait |
| E-36 | Espace Formateur : compteurs fixes (« 3 modules actifs », « 32 inscrits », « 94.5% »), devoirs rendus à noter, QR Code, export PDF, signature certifiée, code de module, barème | écrans 35 à 40 | Valeurs réelles renvoyées par le serveur ou retrait ; remise et notation hors périmètre (D-03) ; champs de cours selon D-05 | retrait et dérivation (section 1) |
| E-37 | Dépôt de fichier (syllabus, sujet de devoir, support) | écrans 37, 40 | Adresse web du document, validée ; le dépôt de fichier dépend d'un stockage à créer (besoin à arbitrer en Phase 2) | retrait provisoire |
| E-38 | Salle et capacité saisies sur le cours | écran 37 | Saisies par séance dans le détail du cours (une formation, plusieurs séances) ; planification et suppression de séance dans l'écran 38 | assumé |
| E-39 | Gestion des événements : calendrier figé, compteur « (24) », cases « Inscription ouverte » et « Liste d'attente activée », formulaire permanent | écran 45 | Calendrier du mois courant alimenté par les événements réels, avec navigation ; nombre réel d'inscrits ; interrupteur de publication ; formulaire ouvert à la demande, complété par les champs obligatoires du modèle | assumé (section 1, UC-19) |
| E-40 | Inscriptions : compteurs fixes, export inactif, promotion « automatique » | écran 48 | Effectifs réels de l'activité choisie, export CSV réel des inscrits (D-06), promotion manuelle d'un membre en liste d'attente | assumé (UC-21) |
| E-41 | Centre de notifications : compteurs fixes, filtre « Mentionnés », dates relatives, incitation aux notifications poussées | écran 33 | Nombre réel de non lues, types du modèle, date réelle, actions « Marquer comme lue » et « Ouvrir » ; mention retirée | assumé et retrait (section 1, D-01) |
| E-42 | Fil social (réactions, commentaires, partage, publications connexes) | écrans 23, 24 | Annonces internes en lecture seule, réservées aux membres | dérivation (D-01) |
| E-43 | Éditeur par blocs glisser-déposer, date de publication, épinglage | écran 44 | Texte structuré (paragraphe, titre de section, citation insérés d'un clic), image de couverture par adresse web, résumé, catégorie réelle, visibilité | dérivation (D-02) |
| E-44 | Notification globale : type, audience à effectifs fixes, programmation | écran 49 | Envoi immédiat à tous les membres actifs, lien interne facultatif, confirmation avant envoi, aperçu en direct conservé | retrait (section 1, UC-22) |
| E-45 | Projets : compteurs fixes, catégories fixes, « à relancer », fichiers joints avec poids, équipe en texte libre | écrans 31, 32, 41, 46, 47 | Décomptes réels (ou absents s'ils ne peuvent pas être exacts), catégories du serveur, liens réels du projet, membres réels ; liste des projets du membre dérivée de l'écran 41 | assumé et retrait (section 1) |
| E-46 | Décision sur un projet : action immédiate, motif facultatif | écran 47 | Motif obligatoire pour un rejet, confirmation avant toute décision, décision affichée si le projet est déjà traité | assumé (UC-20) |
| E-47 | Suivi d'un projet par le formateur : aucun écran de saisie dans la maquette | écran 41 | Page dérivée : fiche du projet, avancement et note de suivi | dérivation (UC-17) |

## 2. Données d'illustration non reprises

Aucun des contenus suivants n'entre dans le produit : noms de personnes, intitulés d'événements, de formations, de projets et d'articles, dates, lieux, compteurs (inscrits, membres, téléchargements, projets), pourcentages (progression, assiduité, disponibilité, conformité), tendances (« +3 », « +18 », « +32 % »), graphiques (activité, sessions hebdomadaires, répartition par filière), journal d'audit, archives de sauvegarde, slogans (« Ensemble vers l'innovation », « Excellence & Innovation », « Apprendre • Partager • Innover »), textes de présentation, textes juridiques, mention « IST pour l'excellence » hors du logo.

## 3. Composants retirés ou conditionnés faute de donnée réelle

| Élément de la maquette | Écrans | Motif | Traitement |
|---|---|---|---|
| « Activités récentes » d'autres membres | 22 | flux social exclu par le CDC | retrait |
| Compteurs de téléchargements | 12 | non mesuré | retrait |
| Liste de tâches et progression d'un projet | 09 | tâches non modélisées ; seul un pourcentage d'avancement saisi par le formateur existe | pourcentage réel affiché, liste retirée |
| Programme horaire, intervenants, tarif | 07 | non modélisés | retrait ; description libre de l'événement |
| « Ajouter au calendrier » | 06, 07 | réalisable sans donnée inventée (fichier iCalendar généré) | conservé si validé (D-06) |
| « Télécharger l'attestation » | 28 | non prévu au CDC | retrait |
| Remise et évaluation de devoirs | 29, 30, 35 | le CDC prévoit la consultation des devoirs, non leur remise | à décider (D-03) |
| QR code d'émargement, export PDF | 39 | non prévus au CDC | retrait |
| « Programmer » une notification | 49 | non prévu au CDC | retrait |
| « Inviter un utilisateur » | 51 | le cas d'usage prévoit la création de compte par l'administrateur | remplacé par « Créer un compte » |
| Disponibilité du serveur, stockage utilisé, assiduité | 50 | aucune mesure réelle disponible | retrait, sauf indicateur réellement mesuré en Phase 3 |
| Graphiques de fréquentation et de sessions | 42, 55 | aucune mesure de visite ; seules des séries d'inscriptions et de créations de comptes peuvent être calculées en base | graphique conservé seulement sur série réelle, sinon état vide |
| Répartition par filière | 55 | filière en saisie libre, donc non agrégeable de façon fiable | retrait |
| « Certificat de conformité », empreintes du journal, « 100 % conforme » | 57 | déclaratif | remplacé par des constats vérifiables (version déployée, état des migrations, paramètres de sécurité effectifs, journal d'audit) |
| Liste d'archives de sauvegarde | 56 | aucune sauvegarde pilotée par l'application | selon décision D-09 |
| Langue « English », « Notifications Push », « Ma progression », « Gérer la visibilité » | 27 | hors périmètre | retrait |
| Champs GitHub, LinkedIn, compétences, localisation | 25, 26 | non modélisés, non demandés par le CDC | à décider (D-04) |
| Onglet « Mentionnés » | 33 | sans objet | retrait |
| Bloc « Environnement Développeur » et extrait de code décoratif | 19, 38 | décor contenant du texte fictif | décor conservé sans texte applicatif fictif, ou retiré si illisible |

## 4. Dérivations prévues

Pages D1 à D8 de l'inventaire ; variantes mobiles et tablettes de toutes les pages ; états de chargement, vide et erreur de chaque zone de données (annexe C, écrans 34 et 66) ; état de focus visible ; modale, onglets et notification éphémère aux largeurs de bureau (E-07).
