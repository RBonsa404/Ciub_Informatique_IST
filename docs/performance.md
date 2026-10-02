# Performance du backend : mesures avant et après la reprise

Mesures du 2 octobre 2026, sur le poste de développement (Windows 11, Java 17.0.12, PostgreSQL 16 en conteneur). Les deux versions ont été construites et lancées de la même façon (profil `prod`, même machine, même base de données de mesure) :

- « avant » : commit `a7eba0c` (état du dépôt au début de la refonte) ;
- « après » : branche `refonte/frontend-v2` à la fin de la Phase 3.

Jeu de données identique dans les deux cas, inséré par SQL : 200 membres, 30 formations publiées de 3 séances, 20 inscrits confirmés par séance (1 800 inscriptions), 30 événements. Les temps sont des médianes (15 appels pour les listes, 3 pour la connexion, limitée à 5 essais par l'ancienne version). Ces chiffres valent pour ce poste ; ils servent à comparer les deux versions, non à prédire les temps en ligne.

## 1. Résultats

| Mesure | Avant | Après | Remarque |
|---|---|---|---|
| Liste des formations (30 lignes) : requêtes SQL | 92 | 4 | une requête par ligne supprimée (section 2) |
| Liste des formations : temps de réponse | 182 ms | 38 ms | |
| Liste des formations : taille transmise | 50 288 octets | 1 484 octets | compression activée ; 40 884 octets avant compression |
| Liste des formations : nouvelle demande sans changement | 50 288 octets | 304, 0 octet | cache conditionnel (`ETag`) |
| Liste des événements (30 lignes) : requêtes SQL | 2 | 3 | la requête ajoutée compte les inscrits, auparavant renvoyés à zéro (B-35) |
| Liste des événements : temps de réponse | 17 ms | 23 ms | prix du compteur exact |
| Connexion (vérification du mot de passe) | 122 ms (coût 10) | 215 à 246 ms (coût 11) | choix expliqué en section 3 |
| Mémoire du processus après démarrage | 700 à 755 Mo | 449 à 509 Mo | réglages de la JVM (section 5) |
| Démarrage sur base vierge (10 migrations) | 19,4 à 23,5 s | 19,5 à 23,9 s | inchangé (section 4) |
| Démarrage sur base déjà migrée | 16,2 à 19,1 s | 15,8 à 17,4 s | inchangé |

## 2. Requêtes par ligne (N+1)

L'ancienne liste des formations chargeait, pour chaque formation, ses séances, ses devoirs, son formateur et les rôles de celui-ci : 92 requêtes pour 30 formations. La nouvelle exécute un nombre fixe de requêtes : la page, son décompte, les séances de toutes les formations de la page, les effectifs de toutes ces séances.

Le test `ExploitationIT.pasDeRequeteParLigne` le garantit : il compte les requêtes SQL émises pour une liste de 3 lignes puis de 9 lignes et exige le même nombre (3 pour les formations, 2 pour les événements, quand la page n'est pas pleine et que le décompte est inutile). Les associations paresseuses restantes se chargent par lots de 50 (`default_batch_fetch_size`).

Les compteurs d'inscrits sont calculés par une requête groupée pour toute la page, jamais par ligne.

## 3. Coût du hachage des mots de passe

L'ancienne configuration annonçait un coût de 12 mais l'encodeur était construit avec un coût de 10 : la propriété n'était pas lue. Le coût est maintenant celui de la configuration (`BCRYPT_STRENGTH`).

| Coût | Temps de connexion mesuré |
|---|---|
| 10 (ancienne version) | 122 ms |
| 11 (retenu) | 215 à 246 ms |
| 12 | 375 ms |

Le coût 11 est retenu par défaut : il double le travail d'un attaquant par rapport à l'existant en gardant la connexion sous le quart de seconde sur ce poste. Sur un processeur partagé plus lent, `BCRYPT_STRENGTH=10` reste conforme au minimum recommandé ; les empreintes déjà enregistrées restent valables quel que soit le coût choisi ensuite. La limitation de débit et le verrouillage du compte bornent par ailleurs le nombre d'essais.

## 4. Démarrage

Le temps de démarrage n'a pas changé : 16 à 20 secondes sur ce poste, dont l'essentiel est l'initialisation de Spring, d'Hibernate et de Flyway. Trois pistes ont été mesurées et écartées faute de gain :

| Piste | Démarrage mesuré | Décision |
|---|---|---|
| Référence (ramasse-miettes série, 384 Mo) | 15,8 à 16,5 s | retenue |
| Initialisation paresseuse des composants | 15,7 à 15,8 s | écartée : gain nul, erreurs de configuration repoussées à la première requête |
| Compilation limitée au premier niveau (`TieredStopAtLevel=1`) | 20,9 s | écartée : pas de gain, connexion plus lente |
| Initialisation différée des dépôts JPA | échec du démarrage | écartée |

Conséquence pour le déploiement : le service ne doit pas être mis en veille (un réveil coûterait ce délai au premier visiteur), et la sonde de santé dispose de 180 secondes (`railway.toml`). Ces deux points sont à vérifier sur Railway en Phase 6, où le temps réel de démarrage sera mesuré.

## 5. Mémoire de la JVM

Sans réglage, la JVM dimensionne son tas sur la mémoire de la machine : 700 à 755 Mo occupés après démarrage. Avec les options du `Dockerfile` (tas borné à 70 % de la mémoire du conteneur, ramasse-miettes série adapté à un seul processeur, piles de 512 ko, arrêt franc si la mémoire est épuisée), la mesure avec un tas de 384 Mo donne 449 à 509 Mo après démarrage et 463 à 515 Mo après la série de requêtes. Un conteneur de 512 Mo est donc juste ; 1 Go laisse de la marge. À confirmer sur Railway en Phase 6.

## 6. Pool de connexions

Le pool de production passe de 20 connexions (5 au repos) à 10 (2 au repos), réglable par `DB_POOL_MAX` : la plateforme sert peu d'utilisateurs simultanés et la base de l'hébergeur limite le nombre de connexions. Les connexions sont renouvelées toutes les 25 minutes et maintenues en vie toutes les 4 minutes, pour ne pas être coupées par le proxy de l'hébergeur. Aucune mesure de charge n'a été faite : la valeur est un réglage de prudence, à revoir si les journaux montrent des attentes de connexion.

## 7. Index

Mesures sur un volume plus grand (20 000 comptes, 300 000 notifications, 20 000 formations), plans relevés par `EXPLAIN ANALYZE`, avec puis sans l'index (suppression annulée aussitôt).

| Requête | Sans index | Avec index | Index |
|---|---|---|---|
| Dix dernières notifications d'un compte | 50,9 ms (parcours complet) | 0,16 ms | `idx_notification_destinataire_date` (V7) ; l'index d'origine sur le destinataire suffisait déjà à éviter le parcours complet |
| Formations d'un formateur | 1,63 ms (parcours complet) | 0,09 ms | `idx_formation_formateur` (V10) |
| Comptes portant un rôle | 3,41 ms | 2,61 ms | `idx_utilisateur_role_role` (V10) |

La migration V10 ajoute aussi les index des filtres par catégorie, des actualités publiées par date et des dates d'expiration des jetons. Les recherches par mot (`LIKE '%mot%'`) parcourent la table : à l'échelle du club (quelques centaines de lignes), ce coût est négligeable ; un index trigramme serait la réponse si le volume l'exigeait.

## 8. Pagination, compression, cache

- Toutes les listes susceptibles de grandir sont paginées, avec une taille de page bornée à 200. Les listes non paginées sont bornées par nature : bureau, catégories, propositions en attente, inscrits d'une activité, trente dernières sauvegardes.
- Compression gzip des réponses JSON de plus de 1 ko : 40 884 octets deviennent 1 484 octets pour la liste des formations. Elle ne fonctionnait pas avec un `ETag` fort, que le serveur refuse de compresser ; l'`ETag` est désormais faible.
- Contenus publics : `ETag` et `Cache-Control: no-cache`. Le navigateur revalide à chaque fois et reçoit 304 sans corps si rien n'a changé.

## 9. Courriel

L'envoi est asynchrone (test `CourrielIT.envoiAsynchrone`) : la requête qui déclenche un courriel n'attend pas le serveur SMTP. Lors des mesures, le serveur SMTP était absent ; l'inscription a tout de même répondu normalement et l'échec d'envoi a été journalisé sans interrompre la requête.
