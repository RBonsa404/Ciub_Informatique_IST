# Cahier des Charges – Application Web du Club Informatique
**Version 1.0** – 12/08/2026  
Équipe projet : 6 étudiants  
Technologies cibles : Angular (Front‑end), Java + Spring Boot (Back‑end), PostgreSQL/MySQL, Git/GitHub  

---
## SECTION 1 : CONTEXTE ET PRÉSENTATION DU PROJET
### 1.1 Vision et Enjeux
Dans notre établissement, plusieurs clubs (art oratoire, anglais, …) bénéficient d’une visibilité et d’une organisation structurée, tandis qu’aucun club d’informatique n’est actuellement actif ou connu. Cette absence limite :
- La diffusion des connaissances techniques auprès des étudiants.
- La valorisation des projets informatiques réalisés en cours ou hors‑cours.
- La possibilité d’organiser des formations, ateliers, hackathons et de suivre la participation des membres.

L’objectif stratégique de la plateforme web est donc de :
1. **Créer une vitrine numérique** présentant le club, ses activités, ses membres et ses réalisations.
2. **Automatiser la gestion** des adhérents, des inscriptions aux événements/formations, des projets et des ressources pédagogiques.
3. **Renforcer l’engagement** grâce à des notifications, un espace de suivi personnel et des possibilités de proposition d’idées.
4. **Assurer la pérennité** du club en fournissant un outil utrzymable, évolutif et sécurisé, administrable par les rôles définis.

L’impact attendu se mesure par :
- Augmentation du nombre de membres actifs (+30 % en première année).
- Réduction du temps de traitement administratif (inscriptions, présences) d’au moins 50 %.
- Amélioration de la visibilité du club auprès de l’administration et des partenaires externes.

### 1.2 Équipe et Organisation
Le projet est réalisé par une équipe de **6 étudiants** en informatique, répartis selon leurs compétences :

| Membre | Rôle principal | Compétences clés |
|--------|----------------|------------------|
| Étudiant 1 | Chef de projet / Analyse | Gestion de projet, rédaction de cahiers des charges, UML |
| Étudiant 2 | Architecte logiciel | Conception d’architecture, modèles C4, design de base de données |
| Étudiant 3 | Développeur Front‑end | Angular, TypeScript, responsive design, UI/UX |
| Étudiant 4 | Développeur Back‑end | Java, Spring Boot, API REST, sécurité |
| Étudiant 5 | DevOps / Qualité | Git/GitHub, CI/CD basique, tests, déploiement |
| Étudiant 6 | Responsable Sécurité | Authentification, 2FA, RGPD, contrôles d’accès |

Les réunions hebdomadaires (1 h) permettront le suivi du planning, la résolution des blocages et la validation des livrables intermédiaires.

### 1.3 Analyse des Parties Prenantes (Matrice de Mendelow)
La matrice suivante classe les acteurs selon leur **pouvoir** (capacité d’influence sur le projet) et leur **intérêt** (niveau de préoccupation vis‑à‑vis du résultat).

| Pouvoir \ Intérêt | **Intérêt élevé** | **Intérêt faible** |
|-------------------|-------------------|--------------------|
| **Pouvoir élevé** | **À gérer de près**<br>• Bureau du club<br>• Administrateur du site<br>• Responsables des activités<br>• Membres actifs du club | **À satisfaire**<br>• Administration de l’établissement<br>• Partenaires du club<br>• CIL, ANSSI |
| **Pouvoir faible** | **À tenir informés**<br>• Membres du club<br>• Étudiants intéressés par le club<br>• Participants aux événements<br>• Visiteurs réguliers du site | **À surveiller**<br>• Visiteurs occasionnels<br>• Public externe peu intéressé par les activités du club |

### 1.4 Priorisation des Fonctionnalités (Méthode MoSCoW)
| Catégorie | Description | Exemples concrets |
|-----------|-------------|-------------------|
| **Must Have** (Incontournables V1) | Fonctionnalités indispensables pour la première version livrable. | • Présentation du club<br>• Gestion des actualités<br>• Gestion des événements (création, modification, suppression, consultation)<br>• Inscription aux événements<br>• Gestion des formations et ateliers<br>• Inscription aux formations<br>• Gestion des membres (création, modification, suppression, rôles)<br>• Publications de ressources publiques<br>• Notifications aux membres<br>• Administration RBAC (gestion utilisateurs, rôles, permissions) |
| **Should Have** (Importants V1) | Fonctionnalités importantes mais pouvant être reportées légèrement sans bloquer la livraison. | • Tableau de bord statistiques du site (nombre de membres, inscriptions)<br>• Galerie photos des événements<br>• Forum de discussion limité (annonces) |
| **Could Have** (Souhaitables V1.x) | Fonctionnalités souhaitées pour les versions ultérieures, apportant une valeur ajoutée. | • Système de badges et récompenses<br>• Intégration d’un moteur de recherche avancé<br>• Export des listes de membres au format CSV/PDF |
| **Won't Have** (Exclus de la V1) | Fonctionnalités délibérément exclues du périmètre initial. | • Application mobile native<br>• Paiement en ligne (cotisations, boutique)<br>• Visioconférence intégrée<br>• Réseau social complet (messagerie privée, fil d’actualité)<br>• Quizs en ligne<br>• Actualités technologiques automatisées<br>• Entraînement de modèles d’IA |

---
## SECTION 2 : PÉRIMÈTRE ET BESOINS FONCTIONNELS
### 2.1 Délimitation du Périmètre
| **Dans le périmètre (In‑Scope)** | **Hors périmètre (Out‑of‑Scope)** |
|----------------------------------|-----------------------------------|
| • Gestion des membres (inscription, profil, rôles)<br>• Gestion des formulaires d’inscription aux événements et formations<br>• Publication et consultation des actualités<br>• Publication et consultation des événements (calendrier)<br>• Publication et consultation des formations/ateliers<br>• Gestion des projets du club (description, état, participants)<br>• Mise à disposition de ressources publiques et réservées aux membres<br>• Système de notifications (email / in‑app)<br>• Administration RBAC (gestion utilisateurs, rôles, permissions)<br>• Authentification sécurisée (hashage mots de passe, 2FA pour admin)<br>• Responsive design (PC, tablette, smartphone)<br>• Compatibilité navigateurs (Chrome, Firefox, Edge)<br>• Hébergement sur serveur mutualisé ou VPS (coût maîtrisé) | • Application mobile native (iOS/Android)<br>• Module de paiement en ligne (Stripe, PayPal)<br>• Solution de visioconférence intégrée (Zoom, Jitsi)<br>• Réseau social complet (messagerie privée, groupes, suivi d’activité)<br>• Moteur de recommandation basé sur IA<br>• Quizs en ligne avec notation automatique<br>• Flux d’actualités technologiques automatisé<br>• Système de badges et récompenses avancé |

### 2.2 Matrice des Rôles et Droits (RBAC)
| Rôle | Description | Droits principaux (CRUD) |
|------|-------------|--------------------------|
| **Visiteur** | Personne extérieure non authentifiée. | Lire : présentation du club, actualités, événements, projets, formations, ressources publiques, équipe du bureau, formulaire de contact. |
| **Membre / Étudiant** | Utilisateur inscrit possédant un compte. | Lire : tout le contenu public + ressources réservées aux membres.<br>Créer/Modifier : son profil, mot de passe.<br>Créer : inscription à un événement/formation.<br>Lire/Mettre à jour : ses inscriptions et participations.<br>Lire : ses notifications personnelles. |
| **Formateur / Responsable d’Activité** | Enseignant ou animateur d’atelier/cours. | Lire : événements, formations, projets auxquels il est associé.<br>Créer/Modifier : ses formations/ateliers, publication de devoirs/ressources associées.<br>Lire : liste des inscrits à ses activités.<br>Modifier : prise de présence (marquer présent/absent). |
| **Responsable du Club** | Membre du bureau chargé de la communication et de l’animation. | Lire : tout le contenu.<br>Créer/Modifier/Supprimer : actualités, événements, projets.<br>Lire : inscriptions aux événements/formations.<br>Créer : envoi de notifications globales aux membres. |
| **Administrateur / Super Admin / DSI** | Responsable technique et de la sécurité du système. | Lire : tout le contenu + statistiques d’utilisation.<br>Créer/Modifier/Supprimer : utilisateurs, rôles, permissions.<br>Créer/Modifier : catégories de contenus (actualités, événements, formations).<br>Lire/Exporter : logs d’accès, sauvegardes.<br>Configurer : authentification renforcée (2FA), politiques de mot de passe, contrôles d’accès.<br>Administrer : hébergement, mises à jour, monitoring. |

### 2.3 Détail des Besoins Fonctionnels par Acteur
Chaque besoin est formulé sous la forme explicite **« Le système doit permettre à [Acteur] de … »**.

#### Visiteur
1. Le système doit permettre au visiteur de **consulter la page d’accueil** présentant le club, sa mission et ses dernières actualités.  
2. Le système doit permettre au visiteur de **consulter la présentation détaillée du club** (historique, objectifs, bureau).  
3. Le système doit permettre au visiteur de **consulter la liste des actualités** avec titre, résumé, date et possibilité de lire l’article complet.  
4. Le système doit permettre au visiteur de **consulter le calendrier des événements** (date, lieu, thème) et d’accéder au détail de chaque événement.  
5. Le système doit permettre au visiteur de **consulter la liste des projets du club** (description, état, participants).  
6. Le système doit permettre au visiteur de **consulter la liste des formations et ateliers** proposés (intitulé, durée, prérequis).  
7. Le système doit permettre au visiteur de **consulter les ressources publiques** (supports de cours, documents téléchargeables).  
8. Le système doit permettre au visiteur de **consulter la présentation des membres du bureau** (photo, fonction, bref biography).  
9. Le système doit permettre au visiteur de **contacter le club** via un formulaire de contact (nom, email, sujet, message) avec accusé de réception automatisé.  

#### Membre / Étudiant
10. Le système doit permettre au membre de **créer un compte** en fournissant nom, prénom, email, date de naissance, filière, et un mot de passe conforme à la politique de sécurité.  
11. Le système doit permettre au membre de **se connecter** grâce à son email et mot de passe, avec option de rappel de mot de passe.  
12. Le système doit permettre au membre de **modifier son profil** (photo, coordonnées, filière, année d’étude).  
13. Le système doit permettre au membre de **réinitialiser son mot de passe** via un lien envoyé à son adresse email enregistré.  
14. Le système doit permettre au membre de **consulter les événements** auxquels il peut s’inscrire (filtrés par date, catégorie).  
15. Le système doit permettre au membre de **s’inscrire à un événement** et de recevoir une confirmation immédiat.  
16. Le système doit permettre au membre de **consulter les formations et ateliers** disponibles.  
17. Le système doit permettre au membre de **s’inscrire à une formation** et de suivre son statut (en attente, accepté, refusé).  
18. Le système doit permettre au membre de **consulter les ressources réservées aux membres** (supports de cours, devoirs, anciens sujets).  
19. Le système doit permettre au membre de **participer aux projets du club** en rejoignant une équipe existante ou en proposant un nouveau projet.  
20. Le système doit permettre au membre de **consulter ses inscriptions et participations** (historique événements, formations, projets).  
21. Le système doit permettre au membre de **soumettre des propositions** (idées de projets, suggestions d’améliorations) via un formulaire dédié.  
22. Le système doit permettre au membre de **recevoir des notifications** (email ou in‑app) concernant ses inscriptions, rappels d’événements, réponses à ses propositions, et annonces importantes.  

#### Formateur / Responsable d’Activité
23. Le système doit permettre au formateur de **créer / modifier une formation ou un atelier** (titre, description, durée, prérequis, capacité maximale).  
24. Le système doit permettre au formateur de **publier des devoirs ou ressources** associés à sa formation (fichiers PDF, liens, consignes).  
25. Le système doit permettre au formateur de **consulter la liste des inscrits** à chacune de ses activités.  
26. Le système doit permettre au formateur de **marquer la présence** des participants à chaque séance (présent, absent, justifié).  
27. Le système doit permettre au formateur de **suivre l’avancement** des projets liés à son activité (état, livrables attendus).  

#### Responsable du Club
28. Le système doit permettre au responsable du club de **publier, modifier ou supprimer une actualité** (titre, corps, image, date de publication).  
29. Le système doit permettre au responsable du club de **publier, modifier ou supprimer un événement** (titre, date, lieu, description, formulaire d’inscription, capacité).  
30. Le système doit permettre au responsable du club de **publier, modifier ou supprimer un projet du club** (titre, description, objectifs, état d’avancement, membres associés).  
31. Le système doit permettre au responsable du club de **consulter les inscriptions** à chaque événement et formation (liste nominative, état).  
32. Le système doit permettre au responsable du club d’**envoyer des notifications globales** à tous les membres (annonces importantes, rappels de deadlines).  

#### Administrateur / Super Admin / DSI
33. Le système doit permettre à l’administrateur de **gérer les utilisateurs** (création, modification, suppression, activation/désactivation).  
34. Le système doit permettre à l’administrateur de **gérer les rôles et permissions** (définition de nouveaux rôles, attribution de droits CRUD).  
35. Le système doit permettre à l’administrateur de **gérer les contenus du site** (catégories d’actualités, types d’événements, catégories de formations).  
36. Le système doit permettre à l’administrateur de **gérer les catégories** (taxonomie utilisée pour le classement des ressources).  
37. Le système doit permettre à l’administrateur de **consulter les statistiques du site** (nombre de visites, inscrits actifs, taux de conversion inscriptions/visites).  
38. Le système doit permettre à l’administrateur de **sécuriser et administrer la plateforme** (configuration du pare‑feu applicatif, gestion des logs, mise à jour des dépendances, audits de sécurité périodiques).  
39. Le système doit permettre à l’administrateur de **mettre en place l’authentification à deux facteurs (2FA)** pour les comptes disposant des rôles administrateur, super admin ou DSI.  
40. Le système doit permettre à l’administrateur de **définir et appliquer une politique de mot de passe** (longueur minimale, complexité, renouvellement périodique).  

---
## SECTION 3 : CONTRAINTES TECHNIQUES ET OPÉRATIONNELLES
### 3.1 Contraintes Techniques
| Domaine | Contrainte | Détails / Justification |
|---------|------------|--------------------------|
| **Architecture** | Client‑serveur (Angular ↔ Spring Boot) | Séparation claire du UI (Front‑end) et de la logique métier (Back‑end) via API REST. |
| **Front‑end** | Angular (TypeScript) + Responsive Design | Framework mature, forte communauté, permet de créer une SPA adaptative (breakpoints pour mobile, tablette, desktop). |
| **Back‑end** | Java 17 + Spring Boot 3.x | Sécurité intégrée (Spring Security), gestion simplifiée des dépendances, bonne performance. |
| **API** | RESTful (JSON) | Standard largement adopté, facile à tester avec des outils comme Postman ou Swagger UI. |
| **Base de données** | PostgreSQL (préféré) ou MySQL | SGBD relationnel ACID, support des contraintes d’intégrité, extensions spatiales éventuelles. |
| **Sécurité** | • Hashage des mots de passe (bcrypt)<br>• Contrôle d’accès basé sur les rôles (RBAC)<br>• 2FA pour les rôles admin/super admin/DSI | Protection des comptes, conformité aux bonnes pratiques OWASP. |
| **Compatibilité navigateurs** | Chrome ≥ 110, Firefox ≥ 105, Edge ≥ 110 | Les navigateurs les plus utilisés dans l’établissement. |
| **Responsive design** | Breakpoints : < 600 px (mobile), 600‑960 px (tablette), > 960 px (desktop) | Garantit une expérience utilisateur homogène. |
| **Versionnement** | Git + GitHub (repo privé) | Historique des changements, revues de code (pull requests), intégration continue basique (GitHub Actions pour build et tests). |
| **Hébergement** | Serveur Linux (Ubuntu LTS) avec Nginx en reverse proxy ou hébergement mutualisé maîtrisé | Coût prévisible (< 15 €/mois), possibilité de scaling vertical si besoin. |

### 3.2 Contraintes Opérationnelles & Organisationnelles
| Aspect | Contrainte | Mesure prévue |
|--------|------------|---------------|
| **Répartition du travail** | Équipe de 6 étudiants avec compétences variées. | Utilisation d’un tableau Kanban (GitHub Projects) pour suivre les tâches par rôle (analyse, dev front, dev back, tests, devops, sécurité). |
| **Calendrier académique** | Le projet doit s’insérer dans le semestre (septembre – janvier). | Jalons définis toutes les 2‑3 semaines ; marges de tampon prévues pour les périodes d’examens. |
| **Qualité du code** | Code lisible, documenté, testé. | Conventions de nommage (Google Java Style, Angular Style Guide), commentaires Javadoc / TSdoc, génération automatique de documentation (Swagger, Compodoc). |
| **Documentation technique** | Guide d’installation, guide utilisateur, spécifi‑cation API. | Livrables L08 (voir Section 5). |
| **Tests** | Tests unitaires, d’intégration, de sécurité. | Couverture cible > 80 % unité, scénarios d’intégration couvrant les parcours critiques (inscription, connexion, publication). |
| **Maintenance post‑déploiement** | Bugs, mises à jour de dépendances, évolution fonctionnelle. | Plan de maintenance mensuel (revue des logs, mises à jour de sécurité), responsabilité désignée (étudiant DevOps). |
| **Maîtrise des coûts d’hébergement** | Budget limité du club. | Choix d’un hébergement mutualisé ou d’un VPS petite taille ; suivi mensuel des dépenses ; possibilité de recourir à des crédits étudiants (GitHub Education, AWS Educate). |
| **Conformité RGPD / CIL** | Protection des données personnelles des membres. | Déclaration de traitement, droit à l’oubli, minimisation des données, chiffrement des colonnes sensibles (email, mot de passe hashé). |

---
## SECTION 4 : BESOINS NON FONCTIONNELS (BNF)
| Code | Intitulé | Catégorie | Description détaillée |
|------|----------|-----------|-----------------------|
| **BNF-01** | Performance | Performance | Temps de réponse moyen < 2 s pour une page en comportement nominal (≤ 100 utilisateurs simultanés). Montée en charge testée jusqu’à 500 connexions simultanées sans dégradation significative (> 5 s). Utilisation de la mise en cache HTTP (ETag, Cache‑Control) et de la pagination côté serveur pour les listes importantes. |
| **BNF-02** | Sécurité | Sécurité | Mots de passe stockés avec hachage bcrypt (coût ≥ 12). Transmission des credentials via HTTPS uniquement (TLS 1.2+). Contrôle d’accès basé sur les rôles (RBAC) appliqué à chaque endpoint API. Authentification à deux facteurs (2FA) obligatoire pour les rôles administrateur, super admin et DSI (OTP via application ou email). Journalisation des événements de connexion (succès/échec) et des modifications sensibles. |
| **BNF-03** | Disponibilité | Disponibilité | Taux de disponibilité cible ≥ 99,5 % mensuel. Redémarrage planifié hors périodes de pointe (nuits, week-ends). Surveillance de la disponibilité via un simple ping/heartbeat et alertes email en cas d’indisponibilité > 5 min. Prévoir une capacité de débordement (autoscaling vertical) lors des pics d’inscription aux événements. |
| **BNF-04** | Ergonomie / UX | Ergonomie | Interface claire, cohérence visuelle (palette de couleurs, typographie). Navigation principale accessible en ≤ 2 clics depuis n’importe quelle page. Libellés des champs de formulaire explicites, aide en ligne (infobulles) et messages d’erreur présents et pertinents. Respect des critères d’accessibilité WCAG 2.1 AA (contraste, taille de police, navigation au clavier). |
| **BNF-05** | Responsive Design | Responsive | Layout basé sur un système de grille (Flexbox / CSS Grid) avec trois breakpoints définis (mobile < 600 px, tablette 600‑960 px, desktop > 960 px). Tous les éléments interactifs (boutons, liens, champs) sont facilement utilisables au toucher (taille minimale 48 × 48 px). Tests réalisés sur dispositifs réels (iOS/Android) et émulateurs (Chrome DevTools). |
| **BNF-06** | Compatibilité | Compatibilité | Fonctionnalité complète et rendu identique sur les dernières versions stables de Chrome, Firefox et Edge (hors fonctionnalités expérimentales). Tests automatisés via navigateurs headless (Playwright) dans le pipeline CI. |
| **BNF-07** | Maintenabilité | Maintenabilité | Architecture en couches clairement séparées (presentation, service, repository, entity). Code.commenté selon les standards (Javadoc pour Java, TSDoc/TSLint pour TypeScript). Utilisation de modules Angular feature‑based et de paquets Spring Boot bien définis. Documentation générée automatiquement (Swagger UI pour API, Compodoc pour Angular). Gestion des dépendances via Maven (pom.xml) et npm (package.json) avec verrouillage des versions (lock‑files). |
| **BNF-08** | Évolutivité / Scalabilité | Évolutivité | Design basé sur des microservices légers au sein du même déploiement (possibilité d’extraire un service de notification ou de statistique ultérieurement). Utilisation de DTO et de mappers (MapStruct) pour éviter les fuites d’abstraction. Schéma de base de données normalisé (3NF) avec tables d’association pour les relations many‑to‑many (utilisateur ↔ rôle, événement ↔ inscrit, etc.). Prévoir des points d’extension (plugin d’événement personnalisé via interface Java). |
| **BNF-09** | Confidentialité / RGPD / CIL | Confidentialité | Collecte minimale des données personnelles (nom, prénom, email, filière, année). Consentement explicite obtenu lors de l’inscription (case à cocher). Droit d’accès, de rectification et d’effacement mis à disposition via le compte utilisateur (« Mes données »). Les adresses email ne sont jamais affichées publiquement. Les journaux d’accès ne conservent pas les adresses IP complètes (masquage après 24 h). Désignation d’un DPO interne (étudiant responsabilité sécurité) pour veiller au respect du RGPD et des recommandations du CIL. |
| **BNF-10** | Sauvegarde & Reprise | Sauvegarde | Sauvegarde logique quotidienne de la base de données (pg_dump / mysqldump) stockée sur un stockage hors site (ex. : bucket S3 compatible ou serveur FTP dédié). Rétention de 30 jours pour les sauvegardes journalières, puis archivage mensuel durant 6 mois. Test de restauration mensuel sur environnement de staging. Documentation de la procédure de reprise après sinistre (RTO < 4 h, RPO < 24 h). |

---
## SECTION 5 : LIVRABLES ET PLANNING PRÉVISIONNEL
### 5.1 Catalogue des Livrables Attendus (L01 à L09)

| Livrable | Code | Description | Format / Support |
|----------|------|-------------|------------------|
| Cahier des Charges | **L01** | Document complet présentant le contexte, périmètre, besoins fonctionnels & non fonctionnels, contraintes, livrables et planning. | Markdown → PDF / .docx (Word) |
| Analyse & Modélisation | **L02** | Diagrammes UML : cas d’utilisation (acteurs & scénarios), séquence (flux clés : inscription, connexion, publication d’actualité), classes (modèle domaine : Utilisateur, Role, Evenement, Formation, Projet, Ressource, Notification). | fichiers .drawio ou .png + spécifications texte |
| Architecture technique | **L03** | Modèle C4 (niveau 1 : système du Club Informatique, niveau 2 : containers : SPA Angular, API Spring Boot, Base de données, serveur Nginx, éventuel service de messagerie). Justification du choix des technologies. | diagrams C4 (Structurizr ou drawio) + rapport |
| Conception BDD | **L04** | Modèle conceptuel de données (MCD) et modèle logique (MLD). Scripts SQL de création des tables (PostgreSQL/MySQL) incluant contraintes de clé primaire, étrangère, vérifications (CHECK) et index. | fichier .sql + diagramme MCD/MLD |
| Design & Maquettes | **L05** | Wireframes (basse fidélité) des pages principales : accueil, présentation, actualités, événement détail, formulaire d’inscription, profil utilisateur, tableau de bord admin. Maquettes haute fidélité (couleurs, typographie, icônes) réalisées sous Figma ou Adobe XD. Kit UI (boutons, formulaires, cartes) exporté en SCSS/HTML. | fichiers .figma, .png, .scss |
| Application Web | **L06** | Code source complet du front‑end Angular (src/), du back‑end Spring Boot (src/main/…), scripts de déploiement (Dockerfile éventuel, docker‑compose.yml), configuration NGINX, fichiers d’environnement. | dépôt GitHub (branche `main`) |
| Cahier de Tests | **L07** | Plans de tests : unitaires (JUnit 5 + Mockito, Jasmine/Karate pour Angular), d’intégration (REST Assured, Protractor/Playground), de sécurité (OWASP ZAP scan). Rapports d’exécution (coverage, résultats). | fichiers .java, .ts, rapports HTML/JUnit |
| Documentation complète | **L08** | Guide d’installation (prérequis, étapes pas à pas), guide d’utilisation (manuel utilisateur, manuel admin), documentation API (Swagger UI avec descriptions détaillées). | PDF/HTML |
| Application déployée & Version finale | **L09** | Instance publique accessible via URL (ex. : https://clubinfo.univ-example.fr) avec base de données de production, certificat TLS (Let’s Encrypt), logs de monitoring, version taguée (`v1.0.0`). | URL accessible, sauvegarde du code taggé, procédures d’exploitation |

### 5.2 Planning Prévisionnel et Phases du Projet
Le projet est découpé en **sept phases chronologiques** couvrant la durée prévisionnelle de 20 semaines (septembre – février). Chaque phase liste les étapes clés, les livrables associés et les jalons (milestones).

| Phase | Durée (semaines) | Étapes principales | Livrables associés | Jalons (Milestones) |
|-------|------------------|--------------------|--------------------|---------------------|
| **1 – Analyse** | 1‑3 | • Recueil des besoins (interviews acteurs)<br>• Rédaction du cahier des charges (L01)<br>• Matrice Mendelow & MoSCoW<br>• Identification des acteurs et rôles | L01 (Cahier des charges) | **M1** : Validation du cahier des charges par le référent club (semaine 3) |
| **2 – Conception** | 4‑5 | • Modélisation UML (cas d’utilisation, séquence, classes) (L02)<br>• Architecture C4 (L03)<br>• Sélection précise des stacks (versions exactes) <br>• Élaboration du plan de gestion de configuration (Git workflow) | L02, L03 | **M2** : Revue d’architecture avec l’encadrant (fin semaine 5) |
| **3 – Design/UI** | 6‑8 | • Wireframes basse fidélité de toutes les pages (L05)<br>• Validation ergonomique avec groupe test (5 étudiants)<br>• Maquettes haute fidélité & kit UI (L05)<br>• Définition de la charte graphique (palette, typographie) | L05 (maquettes, kit UI) | **M3** : Acceptation des maquettes par le bureau du club (semaine 8) |
| **4 – Développement** | 9‑14 | • Sprint 1 : mise en place du projet (repo, CI basique)<br>• Sprint 2 : développement du backend (entities, repos, services, sécurité, 2FA)<br>• Sprint 3 : développement du frontend (modules, routing, services, composants UI)<br>• Sprint 4 : intégration front‑/back‑end (appels API, gestion d’erreurs, formulaires)<br>• Sprint 5 : mise en place de la base de données (scripts L04) et tests de connexion | L04 (scripts BDD), début de L06 (code source) | **M4** : Démo fonctionnelle intermédiaire (inscription, connexion, consultation) – fin semaine 12 |
| **5 – Tests** | 15‑16 | • Élaboration des plans de tests unitaires & d’intégration (L07)<br>• Exécution des tests (coverage ≥ 80 %)<br>• Corrections des anomalies détectées<br>• Tests de sécurité (ZAP Scan) et tests de performance (JMeter léger) | L07 (plans & rapports de tests) | **M5** : Validation du jeu de tests par le référent qualité (semaine 16) |
| **6 – Déploiement** | 17‑18 | • Préparation de l’environnement de production (serveur, NGINX, certificat TLS)<br>• Déploiement de la version candidate (tag `rc1`)<br>• Tests de fumée en production (vérification des endpoints críticos)<br>• Basculement définitif vers la version `v1.0.0` | L06 (code déployé), début de L09 (site live) | **M6** : Mise en ligne officielle (semaine 18) |
| **7 – Livraison & Clôture** | 19‑20 | • Rédaction des guides utilisateur & admin (L08)<br>• Documentation API (Swagger) finalisée<br>• Transfert des accès et procédures d’exploitation au référent club<br>• Bilan de projet (retours d’expérience, leçons apprises)<br>• Archivage du dépôt (tag `v1.0.0`) | L08, L09 (site final, documentation, code taggé) | **M7** : Clôture du projet & présentation finale (semaine 20) |

#### Diagramme de Gantt simplifié (texte)
```
S1  S2  S3  S4  S5  S6  S7  S8  S9 S10 S11 S12 S13 S14 S15 S16 S17 S18 S19 S20
|===A===|===C===|===D===|===DEV===|===T===|===DEP===|===LIV===|
A : Analyse (L01)
C : Conception (L02,L03)
D : Design (L05)
DEV : Développement (L04, début L06)
T : Tests (L07)
DEP : Déploiement (L06 en prod, L09 début)
LIV : Livraison (L08, L09 final)
```

---
### Conclusion
Le présent cahier des charges constitue une base solide pour le développement de l’application web du Club Informatique. Il décrit de façon exhaustive :
- le contexte stratégique et les enjeux,
- les besoins fonctionnels détaillés par acteur,
- les contraintes techniques et opérationnelles à respecter,
- les exigences de qualité (non fonctionnelles) sous forme de tableaux normalisés,
- ainsi que les livrables attendus et le planning prévisionnel phase par phase.

L’équipe de six étudiants pourra ainsi se référer à ce document à chaque étape du projet, assurant ainsi une traçabilité totale, une maîtrise des risques et une livrable conforme aux attentes du club et de l’établissement. 

--- 

*Fin du document.*
