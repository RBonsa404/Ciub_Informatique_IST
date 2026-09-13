# Décisions Techniques — Club Informatique

Ce fichier documente les décisions architecturales non explicitement spécifiées dans le CDC.

---

## DEC-01 : Stratégie d'héritage JPA

**Décision :** `SINGLE_TABLE` avec colonne discriminante `dtype`.

**Justification :** Le CDC et le diagramme de classes définissent une hiérarchie `Utilisateur → Membre | Formateur | ResponsableClub | Administrateur → SuperAdmin | DSI`. Avec SINGLE_TABLE, une seule table `utilisateurs` contient toutes les colonnes + la colonne `dtype`. Spring Security's `loadUserByUsername` bénéficie d'une requête simple sans JOIN. Les colonnes spécifiques aux sous-classes sont nullables (documenté ici, pas un problème pour la 3NF dans ce contexte).

---

## DEC-02 : Gestion des fichiers / uploads

**Décision :** Stockage local dans le volume Docker `/uploads`, servi par Nginx via `/files/`.

**Justification :** Le CDC ne spécifie pas de stockage cloud. Pour une première version locale/VPS, un volume Docker monté suffit. L'URL stockée en base est relative (`/files/photo.jpg`). Évolutivité : remplacer par S3 en changeant uniquement le `FileStorageService`.

---

## DEC-03 : Stratégie tokens JWT

**Décision :** Access token (15 min) en `Authorization: Bearer` header + Refresh token (7 jours) en cookie HttpOnly SameSite=Strict.

**Justification :** Compromis sécurité/expérience : le cookie HttpOnly empêche le vol via XSS, le SPA Angular envoie le bearer dans le header pour l'API. CSRF peu préoccupant car le refresh token n'est pas dans le header Authorization.

---

## DEC-04 : 2FA — Bibliothèque TOTP

**Décision :** `dev.samstevens.totp:totp:1.7.1` (RFC 6238).

**Justification :** Bibliothèque légère, bien maintenue, compatible Google Authenticator / Authy / Microsoft Authenticator. Génère le QR code en base64 pour l'affichage Angular.

---

## DEC-05 : Gestion des roles RBAC

**Décision :** Enum `RoleEnum` (`VISITEUR`, `MEMBRE`, `FORMATEUR`, `RESPONSABLE_CLUB`, `ADMINISTRATEUR`, `SUPERADMIN`, `DSI`) stocké en colonne String dans `utilisateurs`. Table `roles` pour la configuration dynamique (admin peut créer des rôles custom). `@PreAuthorize` Spring Security pour la vérification endpoint-level.

**Justification :** Dual approach : enum pour la logique applicative (rapide, typé), table pour l'administration UI (flexible). Les permissions granulaires sont dans la table `permissions`.

---

## DEC-06 : Consentement RGPD

**Décision :** Colonne `consentement_rgpd BOOLEAN NOT NULL DEFAULT FALSE` dans la table `utilisateurs`, alimentée lors de l'inscription (case obligatoire). L'API refuse l'inscription sans `consentementRgpd = true`.

---

## DEC-07 : Pagination par défaut

**Décision :** `page=0, size=10` par défaut sur tous les endpoints liste. Maximum 100 éléments par page.

---

## DEC-08 : Notifications email

**Décision :** V1 utilise Spring Mail avec configuration SMTP (variables d'environnement). Si SMTP non configuré, les notifications sont uniquement in-app. Pas de service d'envoi asynchrone pour V1 (sync est suffisant pour le volume attendu).

---

## DEC-09 : Validation Bean Validation

**Décision :** Tous les DTOs d'entrée utilisent les annotations `@NotBlank`, `@Email`, `@Size`, `@Min`, `@Max`, `@Future`, etc. Les erreurs de validation sont uniformisées par `GlobalExceptionHandler` en format JSON :
```json
{
  "status": 400,
  "errors": [{"field": "email", "message": "Email invalide"}]
}
```

---

## DEC-10 : CORS

**Décision :** Origins autorisées : `http://localhost:4200` (dev) + variable d'environnement `ALLOWED_ORIGINS` (prod). En Docker Compose, le frontend est servi par Nginx sur le même domaine → CORS non nécessaire en prod, mais configuré pour le développement local.

---

## DEC-11 : Audit Log

**Décision :** Table `audit_logs` (id, utilisateur_id, action, ip_masquee, timestamp). Les IPs sont tronquées après les 3 premiers octets (`192.168.1.xxx`). Journalisation des : connexions réussies, échecs de connexion, modifications sensibles (rôles, mots de passe, suppressions).

---

## DEC-12 : Visibilité des ressources

**Décision :** Enum `Visibilite` : `PUBLIC` (accessible sans connexion) et `MEMBRE` (connexion requise). Les ressources liées à une formation héritent de la visibilité de la formation si non spécifiée.

---

## DEC-13 : Statuts des entités

**Décision :** Enums strings cohérents :
- `Actualite.statut` : `BROUILLON`, `PUBLIE`, `ARCHIVE`
- `Evenement.statut` : `PLANIFIE`, `EN_COURS`, `TERMINE`, `ANNULE`
- `Formation.statut` : `BROUILLON`, `PUBLIE`, `ARCHIVE`
- `SessionFormation.statut` : `PLANIFIEE`, `EN_COURS`, `TERMINEE`, `ANNULEE`
- `Projet.statut` : `EN_ATTENTE`, `VALIDE`, `REJETE`, `EN_COURS`, `TERMINE`
- `Inscription.statut` : `EN_ATTENTE`, `ACCEPTE`, `REFUSE`, `ANNULE`
- `Utilisateur.statut` : `ACTIF`, `INACTIF`, `SUSPENDU`

---

## DEC-14 : Nommage des packages et conventions

**Backend :** Google Java Style Guide. Package racine : `com.clubinfo`.
**Frontend :** Angular Style Guide (kebab-case pour fichiers, PascalCase pour classes, camelCase pour propriétés).
