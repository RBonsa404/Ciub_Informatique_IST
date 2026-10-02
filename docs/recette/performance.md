# Mesures Lighthouse des pages publiques

Date : 2026-10-02. Produit par `node e2e/lighthouse.mjs`.
Cible : frontend de production (image Nginx du déploiement) sur `http://localhost:4300`, backend et base de recette locaux.
Profil : mobile, réseau lent simulé et processeur ralenti quatre fois (réglages par défaut de Lighthouse) ; médiane de 3 mesures par page.
Seuils : Performance 90 ; Accessibilité, Bonnes pratiques et SEO 95 (LCP inférieur ou égal à 2,5 s, CLS inférieur ou égal à 0,1).
Les pages de connexion et d'inscription sont volontairement exclues de l'indexation : leur note SEO n'est pas jugée.

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | FCP | LCP | CLS | Temps de blocage | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 91 | 100 | 100 | 100 | 2,0 s | 3,1 s | 0,032 | 113 ms | conforme |
| `/presentation` | 89 | 100 | 100 | 100 | 1,9 s | 2,8 s | 0,000 | 277 ms | sous le seuil |
| `/bureau` | 94 | 100 | 100 | 100 | 1,9 s | 2,8 s | 0,000 | 50 ms | conforme |
| `/actualites` | 91 | 100 | 100 | 100 | 1,9 s | 3,0 s | 0,036 | 187 ms | conforme |
| `/evenements` | 86 | 100 | 100 | 100 | 1,9 s | 3,6 s | 0,000 | 201 ms | sous le seuil |
| `/formations` | 89 | 100 | 100 | 100 | 1,9 s | 3,5 s | 0,000 | 95 ms | sous le seuil |
| `/projets` | 92 | 100 | 100 | 100 | 1,9 s | 2,9 s | 0,000 | 158 ms | conforme |
| `/ressources` | 91 | 100 | 100 | 100 | 1,9 s | 2,8 s | 0,000 | 192 ms | conforme |
| `/contact` | 90 | 100 | 100 | 100 | 1,7 s | 3,2 s | 0,000 | 152 ms | conforme |
| `/connexion` | 91 | 100 | 100 | 69 (page non indexée) | 1,5 s | 3,2 s | 0,000 | 117 ms | conforme |
| `/inscription` | 91 | 100 | 100 | 69 (page non indexée) | 1,7 s | 3,2 s | 0,000 | 141 ms | conforme |
| `/confidentialite` | 85 | 100 | 100 | 100 | 2,1 s | 2,9 s | 0,000 | 354 ms | sous le seuil |

Verdict : au moins une page sous un seuil.

Ces mesures sont locales (poste de développement, HTTP/1.1 sans chiffrement) : elles sont à refaire sur le site en ligne après le déploiement.
